module.exports = {
  siteUrl: 'https://blackroadinc.us',
  generateRobotsTxt: true,
  exclude: ['/api/*'],
  additionalPaths: async (config) => [
    await config.transform(config, '/codex/feed.xml'),
    await config.transform(config, '/artifacts'),
  ],
};
