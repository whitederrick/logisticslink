export const platform = {
  description: {
    en: "One operating platform for ocean, air, inland transport, and warehousing.",
    ko: "해상, 항공, 내륙운송, 창고를 하나의 운영 체계로 연결하는 물류 플랫폼."
  },
  name: "LogisticsLink"
} as const;

export const services = [
  {
    code: "logisticslink-ocean",
    description: {
      en: "Blind demand aggregation, time-lock reverse auctions, award, and shipment follow-up for ocean freight.",
      ko: "해상 화물의 블라인드 수요 집계, 타임락 역경매, 낙찰, 운송 후속 관리."
    },
    modes: ["OCEAN_FCL", "OCEAN_LCL"],
    name: "LogisticsLink Ocean",
    status: "active"
  },
  {
    code: "air",
    description: {
      en: "Air freight procurement and shipment operations.",
      ko: "항공 운임 조달과 운송 운영."
    },
    modes: ["AIR"],
    name: "Air",
    status: "planned"
  },
  {
    code: "inland",
    description: {
      en: "First-mile, drayage, and inland transportation operations.",
      ko: "퍼스트마일, 내륙운송, 드레이지 운영."
    },
    modes: ["TRUCK", "RAIL"],
    name: "Inland Transport",
    status: "planned"
  },
  {
    code: "warehouse",
    description: {
      en: "Warehouse capacity, handling, and fulfillment operations.",
      ko: "창고 용량, 하역, 풀필먼트 운영."
    },
    modes: ["WAREHOUSE"],
    name: "Warehousing",
    status: "planned"
  }
] as const;

export const activeService = services[0];
