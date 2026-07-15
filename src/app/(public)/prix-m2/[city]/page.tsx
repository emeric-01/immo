import CityPricePage, {
  generateMetadata,
  generateStaticParams,
} from "../../prix-immobilier/[city]/page";

export const revalidate = 7_776_000;

export { generateMetadata, generateStaticParams };
export default CityPricePage;
