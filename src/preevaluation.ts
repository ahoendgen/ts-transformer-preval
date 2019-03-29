import * as shell from 'child_process';
import crypto from 'crypto';
import findCacheDir = require('find-cache-dir');
import * as fs from 'fs';
import * as path from 'path';
import * as deleteDir from 'rimraf';
import * as ts from 'typescript';
import PrevalOptions from './prevalOptions';

let OPTIONS: PrevalOptions = {
  cacheActivated: false,
  debug: false,
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
        node.tag.getText() === tagName
      ) {
        let code: string = node.template.getText().slice(1, -1);

        const dir = path.dirname(node.getSourceFile().fileName);

        const hash = crypto
          .createHash('sha1')
          .update(code)
          .digest('hex');

        // const evalFileDir = dir.split('/')[dir.split('/').length - 1];
        const evalFilename = '_eval.' + hash;
        const evalPath = path.join(dir, evalFilename + '.ts');
        const evalDir = `${dir}/_temp_${hash}`;
        const cacheDir = findCacheDir({
          create: true,
          name: `ts-transformer-preval-macro/${OPTIONS.mode}`
        });

        if (cacheDir === null) {
          throw new Error('not able to create a cache dir');
        }

        const evalResult = path.join(cacheDir, `/${hash}.json`);

        code = `${code} 

run().then((result) => {
console.log(JSON.stringify(result));
});`;

        if (fs.existsSync(evalResult) && OPTIONS.cacheActivated) {
          const cachedRawResult = fs.readFileSync(evalResult);

          return transformResult(cachedRawResult);
        }

        fs.writeFileSync(evalPath, code);

        try {
          shell.execSync(`tsc ${evalPath} --outDir ${evalDir}`);
        } catch (e) {
          // TODO parse tsc errors and decide if something gone really wrong
          if (!OPTIONS.debug) {
            fs.unlinkSync(evalPath);
            deleteDir.sync(evalDir);
            throw e;
          }
        }

        let rawResult = 'null';
        try {
          rawResult = shell
            .execSync(`node ${evalDir}/${evalFilename}.js`)
            .toString();
        } catch (e) {
          if (!OPTIONS.debug) {
            fs.unlinkSync(evalPath);
            deleteDir.sync(evalDir);
            throw e;
          }
        }

        if (!OPTIONS.debug) {
          fs.unlinkSync(evalPath);
          deleteDir.sync(evalDir);
        }

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

export default (options: PrevalOptions) => {
  OPTIONS = {
    ...OPTIONS,
    ...options
  };

  return preevaluationTransformer;
};
