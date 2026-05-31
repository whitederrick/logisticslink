import { StatusBadge } from "@/components/status-badge";
import { statusLabel } from "@/lib/format";
import { Language } from "@/lib/i18n";

const text = {
  en: {
    ACTIVE: {
      body: "This account is active.",
      title: "Account active"
    },
    LOCKED: {
      body: "This account is locked. Contact the ForwardLink administrator before using operational features.",
      title: "Account locked"
    },
    PENDING_APPROVAL: {
      body: "Your company account has been submitted and is waiting for administrator approval. Operational actions will open after approval.",
      title: "Approval pending"
    },
    PENDING_PROFILE: {
      body: "Complete the company profile before operational actions are enabled.",
      title: "Profile pending"
    },
    RESTRICTED: {
      body: "This account is restricted. Quotes, pool participation, and bids are disabled until an administrator restores access.",
      title: "Account restricted"
    },
    SUSPENDED: {
      body: "This account is suspended. Contact the ForwardLink administrator before using operational features.",
      title: "Account suspended"
    }
  },
  ko: {
    ACTIVE: {
      body: "활성 계정입니다.",
      title: "계정 활성"
    },
    LOCKED: {
      body: "잠긴 계정입니다. 운영 기능을 사용하기 전에 ForwardLink 관리자에게 문의해 주세요.",
      title: "계정 잠김"
    },
    PENDING_APPROVAL: {
      body: "기업 계정 신청이 접수되었고 관리자 승인을 기다리고 있습니다. 승인 후 운영 작업을 사용할 수 있습니다.",
      title: "승인 대기"
    },
    PENDING_PROFILE: {
      body: "운영 작업을 사용하려면 기업 프로필을 먼저 완료해야 합니다.",
      title: "프로필 대기"
    },
    RESTRICTED: {
      body: "제한된 계정입니다. 관리자가 접근을 복구할 때까지 견적, 풀 참여, 입찰이 비활성화됩니다.",
      title: "계정 제한"
    },
    SUSPENDED: {
      body: "정지된 계정입니다. 운영 기능을 사용하기 전에 ForwardLink 관리자에게 문의해 주세요.",
      title: "계정 정지"
    }
  }
} as const;

export function AccountStatusNotice({ language, status }: { language: Language; status: string }) {
  const content =
    text[language][status as keyof (typeof text)[typeof language]] ??
    {
      body: statusLabel(status, language),
      title: statusLabel(status, language)
    };

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{content.title}</h2>
        <StatusBadge language={language} value={status} />
      </div>
      <p className="mt-2 text-sm leading-6">{content.body}</p>
    </section>
  );
}
