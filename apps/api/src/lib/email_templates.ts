export function inviteEmail(orgName:string, token:string){
  return {
    subject: `You're invited to join ${orgName} on BlackRoad`,
    text: `Accept your invite:\nhttps://blackroad.io/invite/${token}\n`
  };
}
