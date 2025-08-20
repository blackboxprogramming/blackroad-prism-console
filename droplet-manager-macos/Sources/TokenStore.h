#import <Foundation/Foundation.h>

@protocol TokenStore <NSObject>
- (NSString *)readToken;
- (BOOL)saveToken:(NSString *)token;
@end

@interface KeychainTokenStore : NSObject <TokenStore>
@end
