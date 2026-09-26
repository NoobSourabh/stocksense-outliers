import { RoutePanel, RouteScaffold, ScaffoldForm } from "@/components/warehouse/route-scaffold";

export default function ProfilePage() {
  return (
    <RouteScaffold section="Profile" title="My profile" description="View your account details and manage profile settings.">
      <RoutePanel title="Account details" description="Profile information for the signed-in warehouse user.">
        <ScaffoldForm fields={["Name", "Login ID", "Email", "Role"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
