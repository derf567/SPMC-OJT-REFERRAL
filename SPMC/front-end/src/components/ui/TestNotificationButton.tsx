import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface TestNotificationButtonProps {
  onTest: () => void;
}

export const TestNotificationButton = ({ onTest }: TestNotificationButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onTest}
      className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
      title="Test Notification"
    >
      <Bell className="w-4 h-4 mr-2" />
      Test Notification
    </Button>
  );
};
