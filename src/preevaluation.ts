import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as deleteDir from 'rimraf';
import * as shell from 'child_process';
import * as findCacheDir from 'find-cache-dir';
import prevalOptions from './prevalOptions';

const sha1 = require('sha1');

let _options: prevalOptions = {
  cacheActivated: false,
  mode: 'development'
};

function preevaluationTransformer<T extends ts.Node>(): ts.TransformerFactory<
  T
> {
  return (context: any) => {
    let tagName: string = 'preval';

    const visit: ts.Visitor = (node: ts.Node) => {
      if (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier.getText().indexOf('prevalTransformer') > -1
      ) {
        if (node.importClause !== undefined) {
          tagName = node.importClause.getText().slice(1, -1);
        }
        return undefined;
      }

      if (
        ts.isTaggedTemplateExpression(node) &&
        node.tag.getText() == tagName
      ) {
        let code: string = node.template.getText().slice(1, -1);

        const dir = path.dirname(node.getSourceFile().fileName);

        const hash = sha1(code);

        const evalFileDir = dir.split('/')[dir.split('/').length - 1];
        const evalFilename = '_eval.' + hash;
        const evalPath = path.join(dir, evalFilename + '.ts');
        const evalDir = `${dir}/_temp_${hash}`;
        const evalResult =
          findCacheDir({
            name: `ts-transformer-preval/${_options.mode}`,
            create: true
          }) + `/${hash}.json`;

        code = `${code} 

run().then((result) => {
console.log(JSON.stringify(result));
});`;

        if (fs.existsSync(evalResult) && _options.cacheActivated) {
          const cachedRawResult = fs.readFileSync(evalResult);

          return transformResult(cachedRawResult);
        }

        fs.writeFileSync(evalPath, code);

        try {
          shell.execSync(`tsc ${evalPath} --outDir ${evalDir}`);
        } catch (e) {
          // TODO parse tsc errors and decide if something gone really wrong
          //fs.unlinkSync(evalPath);
          //deleteDir.sync(evalDir);
          //throw e;
        }

        let rawResult = 'null';
        try {
          rawResult = shell
            .execSync(`node ${evalDir}/${evalFileDir}/${evalFilename}.js`)
            .toString();
        } catch (e) {
          fs.unlinkSync(evalPath);
          deleteDir.sync(evalDir);
          throw e;
        }

        fs.unlinkSync(evalPath);
        deleteDir.sync(evalDir);

        fs.writeFileSync(evalResult, rawResult);

        return transformResult(rawResult);
      }

      return ts.visitEachChild(node, (child) => visit(child), context);
    };

    return (node) => {
      return ts.visitNode(node, visit);
    };
  };
}

function transformResult(rawResult: any) {
  const result = JSON.stringify(JSON.parse(rawResult));
  return ts.createCall(
    ts.createPropertyAccess(
      ts.createIdentifier('JSON'),
      ts.createIdentifier('parse')
    ),
    undefined,
    [ts.createStringLiteral(result)]
  );
}

export default (options: prevalOptions) => {
  _options = {
    ..._options,
    ...options
  };

  return preevaluationTransformer;
};
