import { useNavigate } from "react-router-dom";
import { AppShellLayout } from "./pageUtils";
import { EmptyState } from "../components/States";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <AppShellLayout>
      <div className="px-margin md:px-margin-desktop py-space-xl">
        <EmptyState
          icon="travel_explore"
          title="404 — Page not found"
          description="The page you’re looking for has been harvested. Let’s get you back to the mandi."
          actionLabel="Back to Home"
          onAction={() => navigate("/")}
        />
      </div>
    </AppShellLayout>
  );
}
