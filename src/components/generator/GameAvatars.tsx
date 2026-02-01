
import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

// Default size reduced to 42 as requested ("reduce logo size")
const DEFAULT_SIZE = 42;

const BaseAvatar = ({
  src,
  alt,
  size = DEFAULT_SIZE,
  className,
  animate = false
}: AvatarProps & { src: string, alt: string }) => {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-white/20 shadow-sm bg-white/10",
        animate && "animate-float",
        className
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        loading="eager"
        style={{
          // Ensures sharpness on high-res displays
          imageRendering: 'auto'
        }}
      />
    </div>
  );
};

// --- Avatar Exports using Individual Files ---

export const TechHeroAvatar = (props: AvatarProps) => (
  <BaseAvatar {...props} src="/avatars/avatar_tech_hero_hd_1769790952016.png" alt="Visual Start Tech Hero" />
);

export const GamerGirlAvatar = (props: AvatarProps) => (
  <BaseAvatar {...props} src="/avatars/avatar_gamer_girl_hd_1769790965756.png" alt="Visual Pro Gamer Girl" />
);

export const FoxMascotAvatar = (props: AvatarProps) => (
  <BaseAvatar {...props} src="/avatars/avatar_fox_mascot_hd_1769790979836.png" alt="Visual Expert Fox Mascot" />
);

export const FairyTechAvatar = (props: AvatarProps) => (
  <BaseAvatar {...props} src="/avatars/avatar_tech_fairy_hd_1769790994607.png" alt="Visual Brand Fairy" />
);
