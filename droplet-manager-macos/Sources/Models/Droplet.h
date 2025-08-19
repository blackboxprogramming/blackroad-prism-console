#import <Foundation/Foundation.h>

@interface Droplet : NSObject
@property (nonatomic, strong) NSNumber *identifier;
@property (nonatomic, copy) NSString *name;
@property (nonatomic, copy) NSString *ipAddress;
@end
