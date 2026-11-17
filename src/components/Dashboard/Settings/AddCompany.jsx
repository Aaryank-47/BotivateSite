import { Building2 } from "lucide-react";
import AccountManager from "./AccountManager";

export default function AddCompany() {
  return (
    <AccountManager
      kind="company"
      icon={Building2}
      title="Add Company"
      subtitle="Create and manage company (client) accounts: contact, address, GST, access and status."
    />
  );
}
