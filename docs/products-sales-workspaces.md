# Products and sales workspaces

> Historical consolidation notes. The current [Products and Branch Menu workflow](simple-products.md) removes recipe, Pricing, Templates and Requests sections. Products, Branch Menu, Point of Sale and Daily Reports remain the four workspaces.

Products & Sales navigation has four permission-aware entries: Products, Branch Menu, Point of Sale, and Daily Reports. Existing permissions, API contracts, branch boundaries, Dispatch Details, Inventory, and configured ports remain in place.

- **Products:** one searchable shared catalog. View details opens `/products/:productId` with Overview and Recipe navigation. Central editors use `/products/new` and `/products/:productId/setup` for product details, classified stock consumption, service deduction previews, and authorized branch prices in one save. Legacy `/recipes/:productId` links lead editors to setup and retain readable recipe/request access for other roles. The old `/recipes` directory redirects authorized catalog readers to active Products, preserving search and page. See [product setup](product-setup.md).
- **Branch Menu:** Menu items, Pricing, Templates, and Requests share section navigation and consistent page spacing. Each section keeps its existing route. Pricing requires the central pricing grant. Section links preserve explicit branch context where applicable. Single-branch users see fixed context; multiple-branch users receive authorized selectors.
- **Point of Sale:** Checkout and Sales history are separate views at `/pos`. The `view` query parameter supports direct history links. Inactive panels remain mounted, preserving the current branch's cart while switching views and inspecting a sale. Changing branches clears the cart; a full reload does not persist an unfinished order. History shows readable service/status labels, exact currency strings, and a keyboard-accessible row action menu.
- **Daily Reports:** remains a separate operational workspace.

Users with partial/custom grants receive only accessible sections, with the sidebar entry linking to their first authorized section. Sale readers can reach history without a sale-creation grant. Product and recipe links retain independent permission checks.

Search, filters, sorting, pagination, and branch eligibility remain server-backed. Recipe, request, template, and review drafts prompt before following internal navigation links; existing unload warnings and failed-save draft retention remain. The new navigation adds no access grants or automatic business changes.
