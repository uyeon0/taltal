import { Planner } from "@/components/planner/planner";
import { getIngredients } from "@/server/data";

export default async function Home() {
  const ingredients = await getIngredients();
  return <Planner ingredients={ingredients} />;
}
