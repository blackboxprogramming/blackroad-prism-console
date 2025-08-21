#import "DOClient.h"

@interface DOClient ()
@property (nonatomic, strong) id<TokenStore> store;
@end

@implementation DOClient

- (instancetype)initWithTokenStore:(id<TokenStore>)store {
  if (self = [super init]) {
    _store = store;
  }
  return self;
}

- (NSMutableURLRequest *)requestWithPath:(NSString *)path method:(NSString *)method {
  NSString *token = [self.store readToken];
  NSURL *url = [NSURL URLWithString:[@"https://api.digitalocean.com" stringByAppendingString:path]];
  NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url];
  req.HTTPMethod = method;
  [req setValue:[NSString stringWithFormat:@"Bearer %@", token] forHTTPHeaderField:@"Authorization"];
  [req setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  return req;
}

- (void)listDropletsWithCompletion:(DOClientCompletion)completion {
  NSURLRequest *req = [self requestWithPath:@"/v2/droplets" method:@"GET"];
  [[[NSURLSession sharedSession] dataTaskWithRequest:req completionHandler:completion] resume];
}

- (void)performAction:(NSString *)action dropletID:(NSNumber *)dropletID completion:(DOClientCompletion)completion {
  NSString *path = [NSString stringWithFormat:@"/v2/droplets/%@/actions", dropletID];
  NSMutableURLRequest *req = [self requestWithPath:path method:@"POST"];
  NSDictionary *body = @{@"type": action};
  req.HTTPBody = [NSJSONSerialization dataWithJSONObject:body options:0 error:nil];
  // TODO: Add rate-limit backoff and detailed error handling
  [[[NSURLSession sharedSession] dataTaskWithRequest:req completionHandler:completion] resume];
}

@end
