module.exports.rules = {
  'no-raw-colors': {
    meta: { type: 'problem', docs: { description: 'Use tokens, not raw colors' } },
    create(ctx) {
      const colorRe = /#([0-9a-f]{3,8})\b|rgba?\(|hsla?\(/i;
      return {
        Literal(node) {
          if (typeof node.value === 'string' && colorRe.test(node.value)) {
            ctx.report({ node, message: 'Use CSS variables/tokens (e.g., var(--accent)) instead of raw colors.' });
          }
        },
        TemplateLiteral(node) {
          const s = node.quasis.map(q => q.value.cooked).join('${}');
          if (colorRe.test(s)) ctx.report({ node, message: 'Use tokens instead of raw colors.' });
        }
      };
    }
  }
};
