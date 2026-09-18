/**
 * Ícones de linha, minimalistas, cor via currentColor.
 * Substitui emoji usado como ícone funcional em todo o site — trocar por
 * SVG próprio quando o set gerado (ver prompt "placa de rodovia
 * refletiva") estiver pronto: só editar aqui, nenhum outro arquivo muda.
 */
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconVan(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M2 16V8a1 1 0 0 1 1-1h11l4 4h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
      <path d="M13 7v4h4" />
    </svg>
  );
}

export function IconTruck(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M2 7h10v9H2z" />
      <path d="M12 11h4l3 3v2h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}

export function IconCode(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13 6-2 12" />
    </svg>
  );
}

export function IconWrench(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M14.7 6.3a4 4 0 0 0-5.6 4.6L3 17l3 3 6.1-6.1a4 4 0 0 0 4.6-5.6l-2.8 2.8-2.1-2.1z" />
    </svg>
  );
}

export function IconDelivery(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 12h5l-2-2m2 2-2 2" />
    </svg>
  );
}

export function IconCamera(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

export function IconBook(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 5.5v15.5" />
    </svg>
  );
}

export function IconPalette(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3a9 8 0 0 0 0 16c1.4 0 1.6-1.6.4-2.3-.9-.5-.6-1.9.5-1.9H16a4 4 0 0 0 4-4c0-4.4-3.6-7.8-8-7.8z" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFire(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3s4 3.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5-.2 1 .3 2 1.3 2 1.2 0 1.5-1 1.2-2C10.8 6.8 12 5 12 3z" />
      <path d="M9 15a3 3 0 0 0 6 0c0-1.2-.6-2-1.2-2.8" />
    </svg>
  );
}

export function IconBolt(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

export function IconShield(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3 5 6v5c0 5 3 7.5 7 10 4-2.5 7-5 7-10V6z" />
    </svg>
  );
}

export function IconPin(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 21s7-6.6 7-11.5a7 7 0 1 0-14 0C5 14.4 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function IconCompass(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 6-6 2 2-6z" />
    </svg>
  );
}

export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function IconShower(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 8a5 5 0 0 1 9-3" />
      <path d="M4 8h14a2 2 0 0 1 2 2v1H4z" />
      <path d="M7 14v1M11 14v1M15 14v1M9 17v1M13 17v1" />
    </svg>
  );
}

export function IconChat(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 5h16v10H9l-4 4v-4H4z" />
    </svg>
  );
}

export function IconTrophy(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M9.5 20c0-1.7.7-2.3 2.5-3 1.8.7 2.5 1.3 2.5 3" />
    </svg>
  );
}

export function IconGift(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 9h16v3H4zM5 12h14v8H5z" />
      <path d="M12 9v11" />
      <path d="M12 9c-1-3-5-3-5-.5C7 9 9 9 12 9zM12 9c1-3 5-3 5-.5 0 .5-2 .5-5 .5z" />
    </svg>
  );
}

export function IconRocket(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3c3 1.5 5 4.5 5 8.5-1 1-2 1.5-3 1.5H10c-1 0-2-.5-3-1.5C7 7.5 9 4.5 12 3z" />
      <path d="M9.5 13 7 17l3-1M14.5 13l2.5 4-3-1" />
      <circle cx="12" cy="9.5" r="1.4" />
    </svg>
  );
}

export function IconClose(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconSparkle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </svg>
  );
}

export function IconPlug(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0z" />
      <path d="M12 16v5" />
    </svg>
  );
}

export function IconWater(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  );
}

export function IconLock(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function IconWifi(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 9a13 13 0 0 1 16 0" />
      <path d="M7.5 12.5a8.5 8.5 0 0 1 9 0" />
      <path d="M11 16a3.5 3.5 0 0 1 2 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTicket(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M10 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconTent(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 4 3 20h18z" />
      <path d="M12 4v16M8 20l4-9 4 9" />
    </svg>
  );
}

export function IconTractor(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="6" cy="17" r="3" />
      <circle cx="17" cy="17" r="2" />
      <path d="M6 14V7h3l3 4h3v3M9 17h6" />
    </svg>
  );
}

export function IconMedal(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="15" r="5" />
      <path d="m9 4 3 6 3-6M8 4h8" />
      <path d="m10.5 13 1.5 2 1.5-2" />
    </svg>
  );
}

export function IconBriefcase(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="8" width="18" height="11" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function IconBuilding(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10 21v-4h4v4" />
    </svg>
  );
}

export function IconWarning(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 3 2 20h20z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function IconClock(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconHandshake(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M2 12h4l3-3 3 3 2-2 3 3h5" />
      <path d="m9 9-3 3 2 2M15 10l3 3-2 2" />
    </svg>
  );
}

export function IconCoffee(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7 5c0-1 1-1 1-2M10 5c0-1 1-1 1-2" />
    </svg>
  );
}

const ICON_MAP = {
  van: IconVan,
  truck: IconTruck,
  code: IconCode,
  wrench: IconWrench,
  delivery: IconDelivery,
  camera: IconCamera,
  book: IconBook,
  palette: IconPalette,
  fire: IconFire,
  bolt: IconBolt,
  shield: IconShield,
  pin: IconPin,
  compass: IconCompass,
  search: IconSearch,
  shower: IconShower,
  chat: IconChat,
  trophy: IconTrophy,
  gift: IconGift,
  rocket: IconRocket,
  close: IconClose,
  sparkle: IconSparkle,
  plug: IconPlug,
  water: IconWater,
  lock: IconLock,
  wifi: IconWifi,
  coffee: IconCoffee,
  ticket: IconTicket,
  tent: IconTent,
  tractor: IconTractor,
  medal: IconMedal,
  handshake: IconHandshake,
  clock: IconClock,
  briefcase: IconBriefcase,
  building: IconBuilding,
  warning: IconWarning,
  check: IconCheck,
} as const;

export type IconName = keyof typeof ICON_MAP;

/* Ícones com arte 3D gerada (estilo glossy colorido, fundo removido)
   — ficam em /public/icones/<nome>.webp. O resto usa o SVG de linha até
   ganhar arte própria também; trocar aqui quando o resto for gerado. */
const REAL_ART: Partial<Record<IconName, true>> = {
  van: true,
  truck: true,
  code: true,
  wrench: true,
  delivery: true,
  camera: true,
  book: true,
  palette: true,
  bolt: true,
  shield: true,
  pin: true,
  compass: true,
  search: true,
};

export function Icon({
  name,
  className,
  width = 20,
  height = 20,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  if (REAL_ART[name]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/icones/${name}.webp`}
        alt=""
        width={width as number}
        height={height as number}
        className={className}
        style={{ display: "inline-block", objectFit: "contain" }}
      />
    );
  }
  const Component = ICON_MAP[name];
  return <Component className={className} width={width} height={height} {...props} />;
}
