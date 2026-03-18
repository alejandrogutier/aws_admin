"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AwsAccount } from "@/types/aws";

type AccountSwitcherProps = {
  accounts: Pick<AwsAccount, "id" | "name" | "region" | "status">[];
};

export function AccountSwitcher({ accounts }: AccountSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccountId = searchParams.get("accountId");

  const currentAccount = currentAccountId
    ? accounts.find((a) => a.id === currentAccountId)
    : null;

  function handleSelect(accountId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (accountId) {
      params.set("accountId", accountId);
    } else {
      params.delete("accountId");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            {currentAccount ? (
              <>
                <Building2 className="h-4 w-4" />
                <span className="max-w-[150px] truncate">
                  {currentAccount.name}
                </span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                <span>Global</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Seleccionar cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSelect(null)}>
          <Globe className="mr-2 h-4 w-4" />
          Global (Todas las cuentas)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSelect(account.id)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{account.name}</span>
            <span className="text-xs text-muted-foreground">
              {account.region}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
