import { captionTypeDefs } from '../src/schema';

describe('captionTypeDefs', () => {
  it('includes the CaptionJob type', () => {
    expect(captionTypeDefs).toContain('type CaptionJob');
    expect(captionTypeDefs).toContain('captionCreate');
    expect(captionTypeDefs).toContain('captionEvents');
  });
});
