#import <XCTest/XCTest.h>
#import "TokenStore.h"

@interface TokenStoreTests : XCTestCase
@end

@implementation TokenStoreTests
- (void)testSaveAndReadToken {
  KeychainTokenStore *store = [KeychainTokenStore new];
  XCTAssertTrue([store saveToken:@"xyz"]);
  XCTAssertEqualObjects([store readToken], @"xyz");
}
@end
