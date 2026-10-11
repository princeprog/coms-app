# Stock usage and product setup

> Historical workflow, superseded on 2026-10-10 by [Products and Branch Menu](simple-products.md). Stock usage, preparation, recipe setup, branch prices and requests below are retired from active workflows.

Implemented 2026-10-10. Stock classification and product setup extend the existing central catalog and branch menu workflow. Central editing permissions and assigned branch boundaries remain authoritative.

## Classify stock first

Stock Items now has a **Usage** field, separate from Category. Choose every legitimate use of an item; changing a category never changes its usage.

| Usage            | Example                                             | Product setup                                                  |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Ingredient       | Chicken, flour, cooking sauce                       | Prepared-product ingredients                                   |
| Packaging        | Takeout boxes, bags, plastic cups                  | Packaging for both services, Dine-in, or Takeout              |
| Ready to sell    | Bottled drinks, individually stocked finished goods | A direct stock link, or an accompaniment in a prepared product |
| Operating supply | Plastic gloves, cleaning supplies                   | Excluded from product consumption selectors                    |

An item can have multiple usages when that reflects real operations. A bottled drink included in a meal can be a Ready to sell component; it does not need to be treated as a cooking ingredient. Do not classify general operating supplies as per-sale components merely to make them selectable.

New stock items require an explicit usage selection. Existing stock used by recipes is backfilled as Ingredient; other existing stock defaults to Operating supply. Review existing drinks and packaging deliberately. To convert an existing packaging recipe line, first add Packaging to the stock item's allowed usages, then change that component's type in product setup. The migration preserves quantities and historical consumption; it does not infer meaning from item names.

The directory supports URL-backed Usage and Status filters, debounced server search, and backend pagination. The API rejects removal of a usage still referenced by a current product component.

## Set up a product in one place

1. Open **Products → Add product**, or the product's row menu → **Edit**, **Set up recipe**, or **Edit recipe**. Product Overview also links to **Edit product and recipe**. Existing recipe editing links lead central editors to the same dedicated setup workspace.
2. Enter the shared product name, optional description, and permitted Dine-in/Takeout services.
3. Choose the product type:
   - **Prepared product:** add ingredients and quantities per product sold. Every permitted service needs an ingredient. Add optional packaging or direct-sale accompaniments.
   - **Ready to sell:** select exactly one directly sold stock item. Its quantity defaults to one stock unit and applies to both services. Add optional packaging; no cooking recipe is required.
4. Choose stock through searchable, usage-filtered selectors. Enter quantities in the displayed stock unit. For example, 125 g of chicken stocked in kg is **0.125 kg**. Unit conversion is not automatic.
5. Set **Used for** on each component: Both services, Dine-in, or Takeout. Packaging defaults to Takeout. Review the separate exact deductions per product for each permitted service.
6. Authorized central staff can assign branch prices in the same workspace. Prices are exact decimal strings; both service types share the branch price. A price can be assigned later, but the product cannot enter that branch's menu until a central price exists.
7. **Save product** commits the permitted changed sections together. It preserves the draft on errors, prevents duplicate submissions, checks current revisions, and supports an identical retry. Review saved setup after a conflict before deliberately retrying current data.
8. The Branch Manager opens **Branch Menu → Add to menu**, chooses the eligible product, and selects supported service types. Saving product setup or approving a new-product request does not automatically add it to a branch menu.

Component quantities must be positive decimal strings. A product can have up to 100 components. The same stock item may appear in different service scopes, but cannot appear twice in the same scope. Inactive or incorrectly classified stock cannot be saved into a recipe or used for a new sale.

## Branch Manager workflow

Managers can inspect **Product Overview → View product setup**. Saved details and deductions are readable without disabled editing forms. **Request recipe change** opens a dedicated proposal page with the same component controls. New-product requests also support the two product types; proposed ingredients or prices may be omitted, but central approval must complete a valid recipe/direct link and the requesting branch's price.

Central reviewers can adjust quantities, component types, and scopes before approval. The original proposal, current values, final approved details, actor, and decision history remain separate. Changing a product's permitted services invalidates an older recipe review until the reviewer reloads current values.

The menu candidate picker shows blocked products with reasons such as **Missing central price**, **Incomplete recipe**, **Unsupported service**, or **Invalid or inactive stock component**. Blocked options cannot be selected. It also identifies products already on the menu and links authorized users to product setup or requests.

## Sales and history

POS deducts the Both-services quantities plus quantities for the selected service. Ready-to-sell products deduct their direct stock link and applicable packaging. Availability, classification, eligibility, price revisions, and sufficient inventory are checked again within the sale transaction.

Shared setup changes affect future sales. Completed sales preserve their exact price and consumption snapshots; a permitted void reverses those saved deductions even after the recipe changes.

Release steps and verification evidence are in `coms-api/docs/product-setup-release.md`. This work is applied to verified local development only; production rollout remains pending.
