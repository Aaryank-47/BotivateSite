import { UserPlus } from "lucide-react";
import AccountManager from "./AccountManager";

export default function AddUser() {
  return (
    <AccountManager
      kind="user"
      icon={UserPlus}
      title="Add User"
      subtitle="Create and manage employee / admin accounts: details, phone, department, access and status."
    />
  );
}
