#import <Foundation/Foundation.h>
#import "TokenStore.h"

typedef void (^DOClientCompletion)(NSData *data, NSURLResponse *response, NSError *error);

@interface DOClient : NSObject
- (instancetype)initWithTokenStore:(id<TokenStore>)store;
- (void)listDropletsWithCompletion:(DOClientCompletion)completion;
- (void)performAction:(NSString *)action dropletID:(NSNumber *)dropletID completion:(DOClientCompletion)completion;
@end
