import { useState } from "react";
import { Upload, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SystemSettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "SERPREP Educational Platform",
    supportEmail: "support@serprep.edu",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewUsers: true,
    emailContentUploads: true,
    emailAssignmentSubmissions: true,
    emailQuizCompletions: false,
    emailWeeklyDigest: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    minPasswordLength: "8",
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: "30",
  });

  const handleSaveGeneral = () => {
    // Placeholder for save functionality
  };

  const handleSaveNotifications = () => {
    // Placeholder for save functionality
  };

  const handleSaveSecurity = () => {
    // Placeholder for save functionality
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure platform settings and preferences"
      />

      <Tabs defaultValue="general">
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="general" data-testid="tab-general">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic platform information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({
                      ...prev,
                      siteName: e.target.value,
                    }))
                  }
                  data-testid="input-site-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({
                      ...prev,
                      supportEmail: e.target.value,
                    }))
                  }
                  data-testid="input-support-email"
                />
              </div>

              <div className="space-y-2">
                <Label>Platform Logo</Label>
                <div
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover-elevate"
                  data-testid="upload-platform-logo"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveGeneral} data-testid="button-save-general">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>New User Registrations</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email when new users sign up
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNewUsers}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNewUsers: checked,
                      }))
                    }
                    data-testid="switch-email-new-users"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Content Uploads</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email when new content is uploaded
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailContentUploads}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailContentUploads: checked,
                      }))
                    }
                    data-testid="switch-email-content-uploads"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Assignment Submissions</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email when students submit assignments
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAssignmentSubmissions}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailAssignmentSubmissions: checked,
                      }))
                    }
                    data-testid="switch-email-assignment-submissions"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Quiz Completions</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email when students complete quizzes
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailQuizCompletions}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailQuizCompletions: checked,
                      }))
                    }
                    data-testid="switch-email-quiz-completions"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive a weekly summary of platform activity
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailWeeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailWeeklyDigest: checked,
                      }))
                    }
                    data-testid="switch-email-weekly-digest"
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} data-testid="button-save-notifications">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure password policies and session settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="min-password-length">Minimum Password Length</Label>
                <Select
                  value={securitySettings.minPasswordLength}
                  onValueChange={(value) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      minPasswordLength: value,
                    }))
                  }
                >
                  <SelectTrigger id="min-password-length" data-testid="select-min-password-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 characters</SelectItem>
                    <SelectItem value="8">8 characters</SelectItem>
                    <SelectItem value="10">10 characters</SelectItem>
                    <SelectItem value="12">12 characters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Require Uppercase Letters</Label>
                    <p className="text-xs text-muted-foreground">
                      Passwords must contain at least one uppercase letter
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireUppercase}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        requireUppercase: checked,
                      }))
                    }
                    data-testid="switch-require-uppercase"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Require Numbers</Label>
                    <p className="text-xs text-muted-foreground">
                      Passwords must contain at least one number
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireNumbers}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        requireNumbers: checked,
                      }))
                    }
                    data-testid="switch-require-numbers"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-xs text-muted-foreground">
                      Passwords must contain at least one special character
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        requireSpecialChars: checked,
                      }))
                    }
                    data-testid="switch-require-special-chars"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      sessionTimeout: value,
                    }))
                  }
                >
                  <SelectTrigger id="session-timeout" data-testid="select-session-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Users will be logged out after this period of inactivity
                </p>
              </div>

              <Button onClick={handleSaveSecurity} data-testid="button-save-security">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
