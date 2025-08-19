#import <XCTest/XCTest.h>
#import "DOClient.h"

@interface DOClient (Testing)
- (NSMutableURLRequest *)requestWithPath:(NSString *)path method:(NSString *)method;
@end

@interface MockTokenStore : NSObject <TokenStore>
@end
@implementation MockTokenStore
- (NSString *)readToken { return @"abc"; }
- (BOOL)saveToken:(NSString *)token { return YES; }
@end

@interface DOClientTests : XCTestCase
@end

@implementation DOClientTests
- (void)testAuthorizationHeader {
  DOClient *client = [[DOClient alloc] initWithTokenStore:[MockTokenStore new]];
  NSMutableURLRequest *req = [client requestWithPath:@"/v2/droplets" method:@"GET"];
  XCTAssertEqualObjects([req valueForHTTPHeaderField:@"Authorization"], @"Bearer abc");
}
@end
