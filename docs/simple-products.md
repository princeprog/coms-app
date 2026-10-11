# Products and Branch Menu

Current workflow, implemented 2026-10-10. This supersedes the earlier recipe, stock usage, separate pricing, template and request workflows.

## Create or update a product

Super Admin opens **Products → Add product**, or a product's **Edit product** action.

1. Enter a name and selling price. Description is optional.
2. Choose Dine-in, Takeout, or both.
3. Select the branches that should sell it. New products start with no branches selected.
4. Save once. Details, the shared price, and branch availability save together.

Every branch uses the same selling price. Prices retain exact decimal precision; there is no branch price override. Deselecting a branch makes its existing menu entry unavailable and preserves its history. A product can be saved without any selected branch and enabled later. A branch must be active and support at least one selected service.

Drafts remain after a failed save. Concurrent changes require reviewing the saved product; the draft is not silently overwritten. Submitting the same unchanged draft again safely retries the operation.

The Create/Edit product page groups Product details, Service options and Available branches on one surface. Larger checkbox choices make services clear. Search branches uses a 350 ms debounce with server search and bounded pagination; selections persist across searches and pages. Branch rows show their supported services and explain unavailable choices. Cancel protects an unsaved draft; failed saves retain the entered values.

The visible service name is **Takeout** throughout products, branch settings, menus, POS and sales history. Existing API/storage values remain compatible with historical sales.

## View a branch menu

**Branch Menu** shows product, selling price, services and availability. One authorized branch is fixed context; users with several authorized branches choose a branch. Search debounces at 350 ms, and filters, sort and pagination use backend results and the URL.

Super Admin can change availability or offering services from a row's three-dot menu, or edit the shared product. Offering services can narrow the product's services within the branch's capabilities. Other users can read menus at their authorized branches and cannot manage products, prices or menus.

Pricing, Templates and Requests are removed. Legacy links redirect to Branch Menu; recipe links redirect to Products. Stock Items no longer exposes usage classification, and product forms have no preparation, component or recipe controls.

## Sell and void

Select Dine-in or Takeout before adding items. Takeout-only branches select it automatically. Changing service preserves quantities; incompatible cart items block checkout until removed or the service changes.

When a selling price changes before checkout, COMS preserves the cart and shows the old and current prices. The cashier must accept the updated prices and record the sale again. Completed sales keep their original names, quantities and exact price snapshots. Identical successful retries return the original sale.

New sales do not check ingredient stock, deduct inventory, or create consumption movements. Voiding a new sale leaves inventory unchanged. Historical sales that deducted inventory still reverse their saved deductions; missing or inconsistent history blocks the void. Sales history and Daily Reports remain available. Manual inventory, receiving and dispatch workflows continue separately.

## Local delivery

App: port **3005**. API: port **3006**. Refresh open POS clients after the coordinated release. See the API's `docs/simple-products-release.md` for migration, verification and release evidence.
