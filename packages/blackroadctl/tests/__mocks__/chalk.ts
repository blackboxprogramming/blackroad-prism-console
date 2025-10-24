const passthrough = new Proxy(function chalk(text: string) {
  return text;
}, {
  get: (_target, _prop) => passthrough,
  apply: (_target, _thisArg, args) => (args[0] ?? '')
});

export default passthrough as any;
