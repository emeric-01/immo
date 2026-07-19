import Image, { type ImageProps } from "next/image";
import { CONTENT_IMAGE_QUALITY } from "@/lib/content/image-config";

type ContentImageProps = Omit<ImageProps, "alt" | "quality"> & {
  alt: string;
};

export function ContentImage({ alt, ...props }: ContentImageProps) {
  return <Image {...props} alt={alt} quality={CONTENT_IMAGE_QUALITY} />;
}
