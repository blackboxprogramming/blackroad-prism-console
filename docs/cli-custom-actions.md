# Custom CLI Actions

The console's CLI can be extended at runtime by injecting additional actions. This allows local extensions without touching the core codebase.

## Example: `greet`

The snippet below registers a new action named `greet` that prints "Hello, world!" when invoked.

```ts
// greet-action.ts
import type { CLI } from 'prism/cli';

export default function inject(cli: CLI) {
  cli.action('greet', () => {
    console.log('Hello, world!');
  });
}
```

Load the action before running the CLI:

```ts
import { createCli } from 'prism/cli';
import injectGreet from './greet-action';

const cli = createCli();
injectGreet(cli);
cli.run();
```

Running the command prints the greeting:

```bash
$ prism greet
Hello, world!
```
