import { PRODUCT_BYLINE, PRODUCT_MAIN_NAME } from "../lib/product-name";

/**
 * Stacked product title: main name + “by Laundryheap” subheading.
 */
export function ProductBrandHeading({
  className = "",
  mainClassName = "",
  bylineClassName = "",
}) {
  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      <span className={mainClassName}>{PRODUCT_MAIN_NAME}</span>
      <span className={bylineClassName}>{PRODUCT_BYLINE}</span>
    </div>
  );
}
