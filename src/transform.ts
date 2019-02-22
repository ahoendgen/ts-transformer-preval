import preevaluationTransformer from './preevaluation';
import prevalOptions from './prevalOptions';

export default (options?: prevalOptions) => {
  return preevaluationTransformer(options || {});
};
