const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestamp = () => new Date().toISOString();

function categoryMetadata(state, product) {
  const category = state.productCategories.find(
    (item) => item.id === product.category_id,
  );
  if (!category) throw new Error(`Missing fixture category for ${product.id}`);
  return {
    category_id: category.id,
    category_name: category.name,
    category_is_active: category.is_active,
  };
}

function productView(state, product) {
  const { recipe = [], ...fields } = product;
  return {
    ...fields,
    recipe_line_count: recipe.length,
    ...categoryMetadata(state, product),
  };
}

function eligibleServices(branch, product) {
  if (branch.status !== "active" || !product.is_active) return [];
  return product.service_types.filter((service) =>
    service === "DINE_IN" ? branch.has_dine_in : branch.has_takeaway !== false,
  );
}

function handleCategoryRequest({
  request,
  response,
  url,
  body,
  state,
  authUser,
  send,
}) {
  const route = url.pathname.match(
    /^\/product-categories(?:\/(available|[0-9a-f-]{36})(?:\/(deactivate))?)?$/i,
  );
  if (!route) return false;
  const available = route[1] === "available";
  if (
    !available &&
    !(authUser.role?.code === "SUPER_ADMIN" && authUser.role?.isSystem)
  ) {
    return send(response, 403, {
      message: "Only Super Admin can manage product categories.",
    });
  }
  if (request.method === "GET" && (!route[1] || available)) {
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 10);
    const active = url.searchParams.get("is_active");
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      ![10, 30, 50].includes(pageSize) ||
      (active !== null && !["true", "false"].includes(active))
    ) {
      return send(response, 400, { message: "Invalid category query." });
    }
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const matches = state.productCategories
      .filter(
        (category) =>
          (!available || category.is_active) &&
          (available ||
            active === null ||
            category.is_active === (active === "true")) &&
          category.name.toLowerCase().includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    return send(response, 200, {
      items: matches.slice((page - 1) * pageSize, page * pageSize),
      total: matches.length,
      page,
      page_size: pageSize,
    });
  }
  const creating = request.method === "POST" && !route[1];
  const deactivating = request.method === "POST" && route[2] === "deactivate";
  if (
    !creating &&
    !deactivating &&
    !(request.method === "PATCH" && !route[2] && !available)
  ) {
    return send(response, 404, { message: "Category route not found." });
  }
  const category = creating
    ? null
    : state.productCategories.find((item) => item.id === route[1]);
  if (!creating && !category)
    return send(response, 404, { message: "Category not found." });
  if (
    !deactivating &&
    (!body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (key) => !(creating ? ["name"] : ["name", "is_active"]).includes(key),
      ) ||
      (creating && body.name === undefined) ||
      (body.name !== undefined &&
        (typeof body.name !== "string" ||
          body.name.trim().length < 2 ||
          body.name.trim().length > 80)) ||
      (body.is_active !== undefined && typeof body.is_active !== "boolean"))
  ) {
    return send(response, 400, {
      message:
        "Enter a category name between 2 and 80 characters and a valid status.",
    });
  }
  const name = body?.name?.trim();
  if (
    name &&
    state.productCategories.some(
      (item) =>
        item.id !== category?.id &&
        item.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return send(response, 409, {
      message: "A category with this name already exists.",
    });
  }
  if (
    (deactivating || body?.is_active === false) &&
    state.products.some(
      (product) => product.category_id === category.id && product.is_active,
    )
  ) {
    return send(response, 409, {
      message:
        "Move or deactivate active products before deactivating this category.",
    });
  }
  if (creating) {
    const now = timestamp();
    const created = {
      id: `36000000-0000-4000-8000-${String(state.productCategories.length + 1).padStart(12, "0")}`,
      name,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    state.productCategories.push(created);
    return send(response, 201, created);
  }
  if (name !== undefined) category.name = name;
  if (deactivating) category.is_active = false;
  else if (body.is_active !== undefined) category.is_active = body.is_active;
  category.updated_at = timestamp();
  return send(response, 200, category);
}

function setupView(state, product) {
  return {
    product: productView(state, product),
    branch_ids: state.branchProducts
      .filter((offer) => offer.product_id === product.id && offer.is_available)
      .map((offer) => offer.branch_id),
    recipe: (product.recipe ?? []).map((line) => {
      const stock = state.stockItems?.find(
        (item) => item.id === line.stock_item_id,
      );
      return {
        ...line,
        stock_item_name: stock?.stock_item_name ?? "Unknown stock item",
        unit: stock?.unit ?? "",
        is_active: stock?.is_active ?? false,
      };
    }),
  };
}

function validateProduct(state, input, required) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return "Invalid product.";
  if (
    (required || input.product_name !== undefined) &&
    (typeof input.product_name !== "string" ||
      input.product_name.trim().length < 2 ||
      input.product_name.trim().length > 160)
  )
    return "Invalid product name.";
  if (
    (required || input.category_id !== undefined) &&
    (typeof input.category_id !== "string" ||
      !uuid.test(input.category_id) ||
      !state.productCategories.some(
        (category) => category.id === input.category_id && category.is_active,
      ))
  )
    return "Choose an active product category.";
  if (
    (required || input.price !== undefined) &&
    (typeof input.price !== "string" ||
      input.price.length > 80 ||
      !/^\d+(?:\.\d+)?$/.test(input.price))
  )
    return "Invalid selling price.";
  if (
    input.description !== undefined &&
    input.description !== null &&
    (typeof input.description !== "string" || input.description.length > 1000)
  )
    return "Invalid description.";
  if (
    (required || input.service_types !== undefined) &&
    (!Array.isArray(input.service_types) ||
      !input.service_types.length ||
      new Set(input.service_types).size !== input.service_types.length ||
      input.service_types.some(
        (service) => !["DINE_IN", "TAKEAWAY"].includes(service),
      ))
  )
    return "Choose valid service types.";
  if (
    input.branch_ids !== undefined &&
    (!Array.isArray(input.branch_ids) ||
      new Set(input.branch_ids).size !== input.branch_ids.length ||
      input.branch_ids.some(
        (id) =>
          !state.branches.some(
            (branch) => branch.id === id && branch.status === "active",
          ),
      ))
  )
    return "Choose active branches.";
  return null;
}

function assignBranches(state, product, branchIds) {
  if (branchIds === undefined) return;
  for (const offer of state.branchProducts.filter(
    (item) => item.product_id === product.id,
  )) {
    offer.is_available = branchIds.includes(offer.branch_id);
    offer.updated_at = product.updated_at;
  }
  for (const branchId of branchIds) {
    if (
      state.branchProducts.some(
        (offer) =>
          offer.product_id === product.id && offer.branch_id === branchId,
      )
    )
      continue;
    state.branchProducts.push({
      branch_id: branchId,
      product_id: product.id,
      price: product.price,
      is_available: true,
      created_at: product.created_at,
      updated_at: product.updated_at,
    });
  }
}

function handleProductRequest({
  request,
  response,
  url,
  body,
  state,
  send,
  pageItems,
}) {
  const route = url.pathname.match(
    /^\/products(?:\/(setup|[0-9a-f-]{36})(?:\/(setup|deactivate|recipe))?)?$/i,
  );
  if (!route) return false;
  if (route[2] === "recipe")
    return send(response, 404, { message: "Recipe setup is retired." });
  const isSetup = route[1] === "setup" || route[2] === "setup";
  const creating =
    request.method === "POST" && (!route[1] || route[1] === "setup");
  const product =
    route[1] && route[1] !== "setup"
      ? state.products.find((item) => item.id === route[1])
      : null;
  if (route[1] && route[1] !== "setup" && !product)
    return send(response, 404, { message: "Product not found." });
  if (request.method === "GET") {
    if (product)
      return send(
        response,
        200,
        isSetup ? setupView(state, product) : productView(state, product),
      );
    if (isSetup) return send(response, 404, { message: "Product not found." });
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const active = url.searchParams.get("is_active");
    const categoryId = url.searchParams.get("category_id");
    const matches = state.products
      .filter(
        (item) =>
          (active === null || item.is_active === (active === "true")) &&
          (!categoryId || item.category_id === categoryId) &&
          item.product_name.toLowerCase().includes(search),
      )
      .sort(
        (a, b) =>
          a.product_name.localeCompare(b.product_name) ||
          a.id.localeCompare(b.id),
      );
    return send(
      response,
      200,
      pageItems(
        matches.map((item) => productView(state, item)),
        url,
      ),
    );
  }
  if (request.method === "POST" && route[2] === "deactivate") {
    product.is_active = false;
    product.updated_at = timestamp();
    return send(response, 200, productView(state, product));
  }
  if (
    !creating &&
    !(
      product &&
      (isSetup ? request.method === "PUT" : request.method === "PATCH")
    )
  )
    return send(response, 404, { message: "Product route not found." });
  const input = isSetup ? body?.product : body;
  const validation = validateProduct(state, input, creating || isSetup);
  if (validation) return send(response, 400, { message: validation });
  const expectedRevision = body?.expected_product_revision;
  if (
    expectedRevision !== undefined &&
    expectedRevision !== (product?.setup_revision ?? 0)
  )
    return send(response, 409, {
      message: "Product changed. Reload before saving.",
    });
  let saved = product;
  if (creating) {
    const now = timestamp();
    saved = {
      id: `35000000-0000-4000-8000-${String(state.products.length + 1).padStart(12, "0")}`,
      description: null,
      price_revision: 1,
      setup_revision: 1,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  } else {
    if (input.price !== undefined && input.price !== saved.price)
      saved.price_revision += 1;
    saved.setup_revision += 1;
    saved.updated_at = timestamp();
  }
  for (const key of ["product_name", "category_id", "price", "service_types"]) {
    if (input[key] !== undefined)
      saved[key] = key === "product_name" ? input[key].trim() : input[key];
  }
  if (Object.hasOwn(input, "description"))
    saved.description = input.description?.trim() || null;
  if (creating) state.products.push(saved);
  assignBranches(state, saved, input.branch_ids);
  if (isSetup && Array.isArray(body?.recipe))
    saved.recipe = body.recipe.map(
      ({ stock_item_id, quantity, usage_scope }) => ({
        stock_item_id,
        quantity,
        usage_scope,
      }),
    );
  for (const offer of state.branchProducts.filter(
    (item) => item.product_id === saved.id,
  ))
    offer.price = saved.price;
  return send(
    response,
    creating ? 201 : 200,
    isSetup ? setupView(state, saved) : productView(state, saved),
  );
}

module.exports = {
  categoryMetadata,
  productView,
  eligibleServices,
  handleCategoryRequest,
  handleProductRequest,
};
