import * as ts from 'typescript';

export function developmentTransformer<
  T extends ts.Node
>(): ts.TransformerFactory<T> {
  return (context: ts.TransformationContext) => {
    let tagName: string = 'preval';
    let sourceFile: ts.SourceFile;

    const visit: ts.Visitor = (node: ts.Node) => {
      if (sourceFile === undefined) {
        sourceFile = node.getSourceFile();
      }

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
        const codeSource = ts.createSourceFile(
          'preval.ts',
          code,
          node.getSourceFile().languageVersion
        );

        const imports: ts.Node[] = [];
        codeSource.forEachChild((node: ts.Node) => {
          if (ts.isImportDeclaration(node)) {
            imports.push(node);
            return undefined;
          }
        });

        imports.map((imp: ts.Node) => {
          ts.updateSourceFileNode(sourceFile, [
            <ts.Statement>imp,
            ...sourceFile.statements
          ]);
        });

        ts.updateSourceFileNode(sourceFile, codeSource.statements);

        return ts.createAwait(
          ts.createCall(ts.createIdentifier('run'), undefined, [])
        );
      }

      return ts.visitEachChild(node, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
}

export default developmentTransformer;
