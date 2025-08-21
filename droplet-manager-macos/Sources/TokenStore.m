#import "TokenStore.h"
#import <Security/Security.h>

static NSString *const kService = @"droplet-manager-token";

@implementation KeychainTokenStore

- (NSString *)readToken {
  NSDictionary *query = @{(__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                          (__bridge id)kSecAttrService: kService,
                          (__bridge id)kSecReturnData: @YES};
  CFTypeRef data = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &data);
  if (status != errSecSuccess) {
    return nil;
  }
  NSData *result = (__bridge_transfer NSData *)data;
  return [[NSString alloc] initWithData:result encoding:NSUTF8StringEncoding];
}

- (BOOL)saveToken:(NSString *)token {
  NSData *data = [token dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *query = @{(__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                          (__bridge id)kSecAttrService: kService};
  SecItemDelete((__bridge CFDictionaryRef)query);
  NSDictionary *attributes = @{(__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                               (__bridge id)kSecAttrService: kService,
                               (__bridge id)kSecValueData: data};
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)attributes, NULL);
  return status == errSecSuccess;
}

@end
