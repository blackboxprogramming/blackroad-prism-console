import React from 'react';

interface ApprovalRecord {
  id: string;
  capability: string;
}

interface Client {
  approve(id: string): Promise<void>;
  deny(id: string): Promise<void>;
}

const Approvals: React.FC<{ approvals: ApprovalRecord[]; client: Client }> = ({ approvals, client }) => (
  <div>
    {approvals.map((a) => (
      <div key={a.id}>
        <span>{a.capability}</span>
        <button onClick={() => client.approve(a.id)}>Approve</button>
        <button onClick={() => client.deny(a.id)}>Deny</button>
      </div>
    ))}
  </div>
);

export default Approvals;
