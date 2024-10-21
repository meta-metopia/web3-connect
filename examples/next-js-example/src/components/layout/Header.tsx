"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { currentBranch, gitVersions } from "@/lib/gitVersions";
import { MenuIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const deployedUrl = "web3-connect.pagepreview.dev";

export default function Header() {
  const navigate = (version: string) => {
    if (version === currentBranch) {
      return;
    }
    const replaceDotToDash = version.replace(/\./g, "-");
    const url = new URL(`https://${replaceDotToDash}-${deployedUrl}`);
    window.location.href = url.toString();
  };
  return (
    <header
      className={
        "h-16 p-2 border-b flex items-center space-x-4 sticky top-0 bg-white"
      }
    >
      <div>
        <Button variant={"outline"} disabled>
          <MenuIcon />
        </Button>
      </div>
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Playground</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className={"flex-1"} />
      <Select onValueChange={navigate} defaultValue={currentBranch}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Versions" defaultValue={currentBranch} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentBranch}>{currentBranch}</SelectItem>
          {gitVersions
            .filter((v: any) => v !== currentBranch)
            .map((version) => (
              <SelectItem value={version} key={`${version}`}>
                {version}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </header>
  );
}
