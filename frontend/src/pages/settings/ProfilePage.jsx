/**
 * Profile settings: real backend only.
 * Load: GET /api/me (via useAuth). Save: PATCH /api/me (displayName, avatarUrl). Email readonly.
 * Avatar: file selection → preview, then Save Image uploads via POST /api/uploads/image
 * and immediately PATCHes /api/me with the returned URL.
 */
import { useAuth } from "@/hooks/useAuth";
import { setAuthState } from "@/state/auth.state";
import { patchMe } from "@/http/auth.api";
import { uploadImage } from "@/features/chat/api/upload.api";
import { Widget } from "@/components/settings/Widget";
import { ErrorBanner } from "@/components/settings/ErrorBanner";
import { EmptyState } from "@/components/settings/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Calendar, Mail, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useToast } from "@/hooks/useToast";
import { showToast, TOAST_KIND } from "@/lib/showToast";
import { avatarSrc, isDataUrl } from "@/features/chat/utils/avatarUrl";

const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { toast } = useToast();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? user.username ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      setLocalAvatar(user.avatarUrl ?? null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast({ title: "Unsupported image", description: "Use JPG, PNG, GIF, or WebP.", variant: "destructive" });
        return;
      }
      if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        toast({ title: "Image too large", description: "Maximum image size is 2MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setIsDirty(true);
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile || !previewUrl) return;
    setSaveError(null);
    setIsAvatarSaving(true);
    try {
      const { url } = await uploadImage(avatarFile);
      const data = await patchMe({
        displayName: displayName.trim() || undefined,
        avatarUrl: url,
      });
      if (data.user) {
        setAuthState({ user: data.user });
        setLocalAvatar(data.user.avatarUrl ?? null);
        setAvatarUrl(data.user.avatarUrl ?? "");
        setAvatarFile(null);
        setPreviewUrl(null);
        setIsDirty(false);
        setAvatarModalOpen(false);
        showToast(TOAST_KIND.SUCCESS, { title: "Profile picture saved", description: "Your new image is now visible." });
      }
    } catch (err) {
      const msg = err?.message || "Could not save profile picture.";
      setSaveError(msg);
      toast({ title: "Image save failed", description: msg, variant: "destructive" });
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const removeAvatar = async () => {
    setSaveError(null);
    setIsAvatarSaving(true);
    try {
      const data = await patchMe({
        displayName: displayName.trim() || undefined,
        avatarUrl: null,
      });
      if (data.user) {
        setAuthState({ user: data.user });
        setPreviewUrl(null);
        setAvatarFile(null);
        setLocalAvatar(null);
        setAvatarUrl("");
        setIsDirty(false);
        setAvatarModalOpen(false);
        showToast(TOAST_KIND.SUCCESS, { title: "Profile picture removed", description: "Your profile image was cleared." });
      }
    } catch (err) {
      const msg = err?.message || "Could not remove profile picture.";
      setSaveError(msg);
      toast({ title: "Remove failed", description: msg, variant: "destructive" });
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setIsPending(true);
    try {
      let avatarUrlToSave = avatarUrl?.trim() || null;
      if (avatarFile) {
        const { url } = await uploadImage(avatarFile);
        avatarUrlToSave = url;
      }
      const data = await patchMe({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrlToSave,
      });
      if (data.user) {
        setAuthState({ user: data.user });
        setIsDirty(false);
        setLocalAvatar(data.user.avatarUrl ?? null);
        setAvatarFile(null);
        setPreviewUrl(null);
        setAvatarUrl(data.user.avatarUrl ?? null);
        showToast(TOAST_KIND.SUCCESS, { title: "Profile saved", description: "Your changes are now visible everywhere." });
      }
    } catch (err) {
      const msg = err?.message || "Failed to save profile.";
      setSaveError(msg);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your public profile and personal details.</p>
        </div>
        <ErrorBanner message={authError} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your public profile and personal details.</p>
        </div>
        <EmptyState message="Sign in to manage your profile." />
      </div>
    );
  }

  const displayNameOrUsername = displayName.trim() || (user.username ?? "");
  const displayInitial = displayNameOrUsername?.charAt(0)?.toUpperCase() || "U";
  const emailDisplay = user.email ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your public profile and personal details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Widget className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-card to-secondary/30 rounded-xl border border-border">
          <div
            className="relative group cursor-pointer"
            onClick={() => setAvatarModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setAvatarModalOpen(true)}
          >
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-4 border-background shadow-xl overflow-hidden">
              {localAvatar ? (
                <img
                  src={typeof localAvatar === "string" && isDataUrl(localAvatar) ? localAvatar : avatarSrc(localAvatar, user?.updatedAt) ?? localAvatar}
                  alt={user?.username ?? ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayInitial
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold">{displayNameOrUsername || "—"}</h2>
          <p className="text-sm text-muted-foreground">@{user?.username ?? ""}</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            {user?.role ?? "user"}
          </div>
        </Widget>

        <Widget className="md:col-span-2">
          <form onSubmit={onSubmit} className="space-y-6">
            {saveError && <ErrorBanner message={saveError} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="displayName" className="pl-9" value={displayName} onChange={handleChange(setDisplayName)} placeholder="Display name (1–40 characters)" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9 bg-muted/50" value={emailDisplay} readOnly placeholder="Not editable" />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-border/50">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                {user?.createdAt ? `Joined ${formatDate(user.createdAt)}` : "—"}
              </div>
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Widget>
      </div>

      <SettingsDialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen} title="Update Profile Picture">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-40 h-40 rounded-full border-4 border-muted overflow-hidden shadow-inner bg-muted flex items-center justify-center">
            {(() => {
              const modalHasImage = Boolean(previewUrl || localAvatar);
              if (modalHasImage) {
                const modalImgSrc = previewUrl || (typeof localAvatar === "string" && isDataUrl(localAvatar) ? localAvatar : (avatarSrc(localAvatar, user?.updatedAt) ?? localAvatar));
                return <img src={modalImgSrc} alt="Avatar" className="w-full h-full object-cover" />;
              }
              return (
                <span className="text-4xl font-bold text-primary">{displayInitial}</span>
              );
            })()}
          </div>
          <Label htmlFor="avatar-upload" className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <Camera className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Click to upload new image</span>
            </div>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </Label>
          {(localAvatar || previewUrl) && (
            <Button type="button" variant="destructive" onClick={removeAvatar} disabled={isAvatarSaving} className="w-full sm:w-auto">
              {isAvatarSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove current image
            </Button>
          )}
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" disabled={isAvatarSaving} onClick={() => { setPreviewUrl(null); setAvatarFile(null); setAvatarModalOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={saveAvatar} disabled={!previewUrl || isAvatarSaving}>
              {isAvatarSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isAvatarSaving ? "Saving..." : "Save Image"}
            </Button>
          </div>
        </div>
      </SettingsDialog>
    </div>
  );
}
