export type CommandResult =
  | { type: 'create_file'; filename: string; content: string }
  | { type: 'generate_image' }
  | { type: 'run_code' }
  | { type: 'save_project'; name: string }
  | { type: null };

export function interpretCommand(input: string): CommandResult {
  const createMatch = input.match(/create a file called `([^`]+)` with (.+)/i);
  if (createMatch) {
    return { type: 'create_file', filename: createMatch[1], content: createMatch[2] };
  }
  if (/generate an? image/i.test(input)) {
    return { type: 'generate_image' };
  }
  if (/run this code/i.test(input)) {
    return { type: 'run_code' };
  }
  const saveMatch = input.match(/save (?:this )?as (?:project )?([\w-]+)/i);
  if (saveMatch) {
    return { type: 'save_project', name: saveMatch[1] };
  }
  return { type: null };
}
