import preevaluationTransformer from './preevaluation';
import prevalOptions from './prevalOptions';
//import developmentTransformer from "./development";

// const mode: string = process.env.NODE_ENV || "production";

export default (options?: prevalOptions) => {
  // if (mode === "production") {
  return preevaluationTransformer(options || {});
  // } else {
  // return  createTransformer = developmentTransformer(caching);
  // }
};
