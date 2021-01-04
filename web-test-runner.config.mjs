export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  middleware: [
    function rewriteBase(context, next) {
      if (context.url.indexOf('/base') === 0) {
        context.url = context.url.replace('/base', '')
      }
      return next();
    }
  ],
  testRunnerHtml: (testFramework) =>
    `<html>
		<body>
		  <script src="node_modules/codemirror/lib/codemirror.js"></script>
		  <script src="node_modules/codemirror/addon/mode/loadmode.js"></script>
		  <script src="node_modules/codemirror/mode/meta.js"></script>
		  <script type="module" src="${testFramework}"></script>
		</body>
	  </html>`
};