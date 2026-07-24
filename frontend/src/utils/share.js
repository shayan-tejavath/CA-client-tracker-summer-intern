import { toast } from "react-toastify";

export const sharePage = async ({
  title,
  text,
  url = window.location.href,
  copySuccessMessage = "Link copied.",
}) => {
  const shareData = {
    title,
    text,
    url,
  };

  try {
    if (navigator?.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(copySuccessMessage);
    }
  } catch {
    toast.info("Share cancelled.");
  }
};
