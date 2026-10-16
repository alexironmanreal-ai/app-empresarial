/**
 * Roadmap de fases del OS — 120 micro-fases.
 * El progreso se infiere de keywords en commits de GitHub (no “hecho” fijo).
 * Cada fase aporta carga a la batería global.
 */

export type OsPhaseDef = {
  n: number;
  name: string;
  stage: string;
  keywords: string[];
};

export const OS_PHASE_DEFS: OsPhaseDef[] = [
  { n: 1, stage: "Fundación", name: "Repo + README + licencia", keywords: ["readme", "license", "init", "initial"] },
  { n: 2, stage: "Fundación", name: "Makefile / build scripts", keywords: ["makefile", "make", "build script"] },
  { n: 3, stage: "Fundación", name: "Toolchain cross-compile", keywords: ["toolchain", "cross", "gcc", "clang", "target"] },
  { n: 4, stage: "Fundación", name: "CI básico", keywords: ["ci", "github actions", "workflow", "pipeline"] },
  { n: 5, stage: "Fundación", name: "Spec / design docs", keywords: ["spec", "design", "rfc", "architecture"] },
  { n: 6, stage: "Boot", name: "Bootloader stub", keywords: ["bootloader", "boot.s", "boot.asm", "mbr"] },
  { n: 7, stage: "Boot", name: "Multiboot / limine", keywords: ["multiboot", "limine", "grub"] },
  { n: 8, stage: "Boot", name: "Entry 32/64-bit", keywords: ["entry", "start.s", "_start", "long mode"] },
  { n: 9, stage: "Boot", name: "GDT / segmentos", keywords: ["gdt", "segment", "descriptor"] },
  { n: 10, stage: "Boot", name: "IDT vacía", keywords: ["idt", "interrupt descriptor"] },
  { n: 11, stage: "Boot", name: "Early serial / UART log", keywords: ["serial", "uart", "com1", "earlyprintk"] },
  { n: 12, stage: "Boot", name: "QEMU smoke test", keywords: ["qemu", "smoke", "run.sh"] },
  { n: 13, stage: "Boot", name: "Linker script", keywords: ["linker", "ldscript", "link.ld"] },
  { n: 14, stage: "Boot", name: "Higher-half kernel", keywords: ["higher half", "higher-half", "kernel map"] },
  { n: 15, stage: "Boot", name: "Boot protocol estable", keywords: ["boot protocol", "bootinfo", "handoff"] },
  { n: 16, stage: "Memoria", name: "Physical memory map", keywords: ["mmap", "e820", "phys mem", "memory map"] },
  { n: 17, stage: "Memoria", name: "PMM bitmap / buddy", keywords: ["pmm", "buddy", "frame alloc", "page frame"] },
  { n: 18, stage: "Memoria", name: "Paging enable", keywords: ["paging", "page table", "cr3"] },
  { n: 19, stage: "Memoria", name: "Page fault handler", keywords: ["page fault", "#pf", "pf handler"] },
  { n: 20, stage: "Memoria", name: "Kernel heap kmalloc", keywords: ["kmalloc", "heap", "slab", "kheap"] },
  { n: 21, stage: "Memoria", name: "VMM map/unmap", keywords: ["vmm", "map page", "unmap", "virt"] },
  { n: 22, stage: "Memoria", name: "User address space", keywords: ["user space map", "aspace", "mm_struct"] },
  { n: 23, stage: "CPU", name: "IRQ controller (PIC/APIC)", keywords: ["pic", "apic", "ioapic", "irq"] },
  { n: 24, stage: "CPU", name: "Timer / PIT / HPET", keywords: ["timer", "pit", "hpet", "tick"] },
  { n: 25, stage: "CPU", name: "Exceptions completas", keywords: ["exception", "fault", "trap", "panic"] },
  { n: 26, stage: "CPU", name: "Syscall gate", keywords: ["syscall", "sysret", "int 0x80", "syscall handler"] },
  { n: 27, stage: "CPU", name: "Context switch asm", keywords: ["context switch", "switch_to", "swapgs"] },
  { n: 28, stage: "CPU", name: "SMP detect", keywords: ["smp", "multiprocessor", "cpu count"] },
  { n: 29, stage: "CPU", name: "Per-CPU data", keywords: ["percpu", "per-cpu", "gs base"] },
  { n: 30, stage: "CPU", name: "FPU / SSE lazy", keywords: ["fpu", "sse", "xsave", "fxsave"] },
  { n: 31, stage: "CPU", name: "TSC calibration", keywords: ["tsc", "calibrat", "rdtsc"] },
  { n: 32, stage: "CPU", name: "Idle loop", keywords: ["idle", "hlt", "cpu_idle"] },
  { n: 33, stage: "CPU", name: "NMI / watchdog", keywords: ["nmi", "watchdog"] },
  { n: 34, stage: "CPU", name: "CPU features CPUID", keywords: ["cpuid", "feature flag"] },
  { n: 35, stage: "CPU", name: "Kernel preemption flag", keywords: ["preempt", "preemption"] },
  { n: 36, stage: "Procesos", name: "task_struct mínimo", keywords: ["task_struct", "task.c", "pcb"] },
  { n: 37, stage: "Procesos", name: "create_task / kthread", keywords: ["kthread", "create_task", "spawn"] },
  { n: 38, stage: "Procesos", name: "Scheduler round-robin", keywords: ["scheduler", "schedule", "rr"] },
  { n: 39, stage: "Procesos", name: "Prioridades", keywords: ["priority", "nice", "prio"] },
  { n: 40, stage: "Procesos", name: "sleep / wake", keywords: ["sleep", "wake", "wait_queue"] },
  { n: 41, stage: "Procesos", name: "wait / exit / zombie", keywords: ["wait", "zombie", "exit", "reap"] },
  { n: 42, stage: "Procesos", name: "fork", keywords: ["fork", "clone"] },
  { n: 43, stage: "Procesos", name: "execve", keywords: ["exec", "execve", "load elf"] },
  { n: 44, stage: "Procesos", name: "ELF loader", keywords: ["elf", "loader", "pt_load"] },
  { n: 45, stage: "Procesos", name: "argv / envp", keywords: ["argv", "envp", "args"] },
  { n: 46, stage: "Procesos", name: "PID namespace simple", keywords: ["pid", "pidmap"] },
  { n: 47, stage: "Procesos", name: "Signals básicos", keywords: ["signal", "sigkill", "sigterm"] },
  { n: 48, stage: "Procesos", name: "pipe", keywords: ["pipe", "pipefs"] },
  { n: 49, stage: "Procesos", name: "dup / fd table", keywords: ["dup", "fd table", "file descriptor"] },
  { n: 50, stage: "Procesos", name: "brk / sbrk", keywords: ["brk", "sbrk", "user heap"] },
  { n: 51, stage: "Procesos", name: "mmap user", keywords: ["mmap", "munmap"] },
  { n: 52, stage: "Procesos", name: "CFS-ish o MLFQ", keywords: ["cfs", "mlfq", "fair sched"] },
  { n: 53, stage: "Procesos", name: "Affinity / cpuset", keywords: ["affinity", "cpuset"] },
  { n: 54, stage: "Procesos", name: "Process groups", keywords: ["pgrp", "session", "job control"] },
  { n: 55, stage: "Procesos", name: "OOM killer stub", keywords: ["oom", "out of memory"] },
  { n: 56, stage: "FS", name: "VFS interfaces", keywords: ["vfs", "inode", "dentry", "file_ops"] },
  { n: 57, stage: "FS", name: "initrd / ramfs", keywords: ["initrd", "ramfs", "tmpfs"] },
  { n: 58, stage: "FS", name: "devfs / device nodes", keywords: ["devfs", "mknod", "device node"] },
  { n: 59, stage: "FS", name: "Block device layer", keywords: ["block", "bio", "blkdev"] },
  { n: 60, stage: "FS", name: "ATA / AHCI o virtio-blk", keywords: ["ata", "ahci", "virtio-blk", "disk"] },
  { n: 61, stage: "FS", name: "Partition parse", keywords: ["partition", "gpt", "mbr part"] },
  { n: 62, stage: "FS", name: "ext2/simple FS read", keywords: ["ext2", "filesystem", "superblock"] },
  { n: 63, stage: "FS", name: "open / read / write / close", keywords: ["sys_open", "sys_read", "sys_write"] },
  { n: 64, stage: "FS", name: "getdents / readdir", keywords: ["getdents", "readdir", "listdir"] },
  { n: 65, stage: "FS", name: "cwd / chdir", keywords: ["chdir", "getcwd", "cwd"] },
  { n: 66, stage: "FS", name: "mount / umount", keywords: ["mount", "umount"] },
  { n: 67, stage: "Drivers", name: "Keyboard PS/2", keywords: ["keyboard", "ps2", "kbd"] },
  { n: 68, stage: "Drivers", name: "Mouse", keywords: ["mouse", "ps2 mouse"] },
  { n: 69, stage: "Drivers", name: "Framebuffer / GOP", keywords: ["framebuffer", "gop", "fbdev", "vesa"] },
  { n: 70, stage: "Drivers", name: "Virtio net", keywords: ["virtio", "virtio-net", "net driver"] },
  { n: 71, stage: "Drivers", name: "PCI enum", keywords: ["pci", "pci scan", "lspci"] },
  { n: 72, stage: "Drivers", name: "ACPI tables parse", keywords: ["acpi", "rsdp", "dsdt"] },
  { n: 73, stage: "Drivers", name: "RTC clock", keywords: ["rtc", "cmos", "wall clock"] },
  { n: 74, stage: "Drivers", name: "Random entropy", keywords: ["random", "entropy", "rdrand"] },
  { n: 75, stage: "Drivers", name: "Poweroff / reboot", keywords: ["poweroff", "reboot", "acpi shutdown"] },
  { n: 76, stage: "Userspace", name: "crt0 / _start user", keywords: ["crt0", "crt1", "user _start"] },
  { n: 77, stage: "Userspace", name: "libc mínima", keywords: ["libc", "musl", "newlib"] },
  { n: 78, stage: "Userspace", name: "stdio printf", keywords: ["printf", "stdio", "puts"] },
  { n: 79, stage: "Userspace", name: "malloc user", keywords: ["malloc", "free", "user malloc"] },
  { n: 80, stage: "Userspace", name: "string.h set", keywords: ["memcpy", "strlen", "string.h"] },
  { n: 81, stage: "Userspace", name: "Shell v1", keywords: ["shell", "sh", "cmdline"] },
  { n: 82, stage: "Userspace", name: "echo / cat / ls", keywords: ["echo", "cat", "ls"] },
  { n: 83, stage: "Userspace", name: "cd / pwd", keywords: ["pwd", "cd builtin"] },
  { n: 84, stage: "Userspace", name: "Pipes en shell", keywords: ["shell pipe", "pipeline"] },
  { n: 85, stage: "Userspace", name: "Redirección > <", keywords: ["redirect", "redir"] },
  { n: 86, stage: "Userspace", name: "Background jobs", keywords: ["bg", "fg", "job"] },
  { n: 87, stage: "Userspace", name: "init process", keywords: ["init", "pid 1", "initrd init"] },
  { n: 88, stage: "Userspace", name: "login / getty", keywords: ["login", "getty", "auth"] },
  { n: 89, stage: "Userspace", name: "Multi-ELF load", keywords: ["multi-elf", "multiple binaries"] },
  { n: 90, stage: "Userspace", name: "Dynamic linker stub", keywords: ["dynamic linker", "ld.so", "plt"] },
  { n: 91, stage: "Userspace", name: "Shared libs .so", keywords: [".so", "shared lib", "dynlib"] },
  { n: 92, stage: "Userspace", name: "Test suite userland", keywords: ["userland test", "userspace test"] },
  { n: 93, stage: "Userspace", name: "Package layout /usr", keywords: ["usr", "prefix", "sysroot"] },
  { n: 94, stage: "Userspace", name: "Scripting host", keywords: ["lua", "python", "script host"] },
  { n: 95, stage: "Userspace", name: "Editor mínimo", keywords: ["editor", "vi", "nano"] },
  { n: 96, stage: "Red", name: "Ethernet frame RX/TX", keywords: ["ethernet", "netif", "rx tx"] },
  { n: 97, stage: "Red", name: "ARP", keywords: ["arp"] },
  { n: 98, stage: "Red", name: "IPv4 stack", keywords: ["ipv4", "ip stack"] },
  { n: 99, stage: "Red", name: "ICMP ping", keywords: ["icmp", "ping"] },
  { n: 100, stage: "Red", name: "UDP", keywords: ["udp"] },
  { n: 101, stage: "Red", name: "TCP handshake", keywords: ["tcp", "handshake"] },
  { n: 102, stage: "Red", name: "sockets API", keywords: ["socket", "bind", "listen", "accept"] },
  { n: 103, stage: "Red", name: "DNS stub", keywords: ["dns", "resolver"] },
  { n: 104, stage: "Red", name: "HTTP client/server toy", keywords: ["http", "httpd"] },
  { n: 105, stage: "Release", name: "ISO bootable", keywords: ["iso", "isobuild", "xorriso"] },
  { n: 106, stage: "Release", name: "Installer script", keywords: ["install", "installer"] },
  { n: 107, stage: "Release", name: "Version tags v1.x", keywords: ["v1.0", "v1.1", "v1.2", "v1.3", "tag"] },
  { n: 108, stage: "Release", name: "Changelog discipline", keywords: ["changelog", "release notes"] },
  { n: 109, stage: "Calidad", name: "KASAN / sanitizers", keywords: ["kasan", "sanitizer", "ubsan"] },
  { n: 110, stage: "Calidad", name: "Unit tests kernel", keywords: ["kunit", "kernel test", "unittest"] },
  { n: 111, stage: "Calidad", name: "Fuzz syscalls", keywords: ["fuzz", "syzkaller"] },
  { n: 112, stage: "Calidad", name: "Docs man pages", keywords: ["man page", "docs", "documentation"] },
  { n: 113, stage: "Calidad", name: "Benchmark suite", keywords: ["benchmark", "bench", "perf"] },
  { n: 114, stage: "Seguridad", name: "User/kernel isolation audit", keywords: ["isolation", "smap", "smep"] },
  { n: 115, stage: "Seguridad", name: "ASLR", keywords: ["aslr", "randomize"] },
  { n: 116, stage: "Seguridad", name: "Stack canaries", keywords: ["canary", "stack protector"] },
  { n: 117, stage: "Producto", name: "GUI toolkit mínimo", keywords: ["gui", "window", "wm"] },
  { n: 118, stage: "Producto", name: "Audio driver", keywords: ["audio", "sound", "ac97", "hda"] },
  { n: 119, stage: "Producto", name: "App store / pkgs", keywords: ["package manager", "pkgs", "app store"] },
  { n: 120, stage: "Producto", name: "Stable daily driver goal", keywords: ["stable", "daily driver", "production"] },
];

export const OS_PHASE_COUNT = OS_PHASE_DEFS.length;

export type PhaseStatus = "done" | "active" | "partial" | "pending";

export type OsPhaseView = OsPhaseDef & {
  status: PhaseStatus;
  hits: number;
  charge: number;
  evidence: string[];
};

export type OsBatterySnapshot = {
  phases: OsPhaseView[];
  chargePct: number;
  doneCount: number;
  partialCount: number;
  active: OsPhaseView | null;
  stages: { stage: string; chargePct: number; done: number; total: number }[];
};

function scorePhase(
  commits: { message?: string }[],
  keywords: string[],
): { hits: number; evidence: string[]; charge: number } {
  const evidence: string[] = [];
  let hits = 0;
  const lowerKeys = keywords.map((k) => k.toLowerCase());
  for (const c of commits) {
    const msg = (c.message ?? "").toLowerCase();
    if (lowerKeys.some((k) => msg.includes(k))) {
      hits += 1;
      if (evidence.length < 2) evidence.push(c.message ?? "");
    }
  }
  const charge = hits <= 0 ? 0 : hits === 1 ? 0.7 : 1;
  return { hits, evidence, charge };
}

export function computeOsBattery(
  commits: { message?: string }[] | null | undefined,
): OsBatterySnapshot {
  const list = commits ?? [];
  const phases: OsPhaseView[] = OS_PHASE_DEFS.map((def) => {
    const { hits, evidence, charge } = scorePhase(list, def.keywords);
    let status: PhaseStatus = "pending";
    if (charge >= 1) status = "done";
    else if (charge > 0) status = "partial";
    return { ...def, hits, evidence, charge, status };
  });

  const firstOpen = phases.findIndex((p) => p.status !== "done");
  if (firstOpen >= 0) {
    phases[firstOpen] = { ...phases[firstOpen], status: "active" };
  }

  const chargePct =
    phases.length === 0
      ? 0
      : Math.round(
          (phases.reduce((a, p) => a + p.charge, 0) / phases.length) * 1000,
        ) / 10;

  const doneCount = phases.filter((p) => p.charge >= 1).length;
  const partialCount = phases.filter((p) => p.charge > 0 && p.charge < 1).length;
  const active = phases.find((p) => p.status === "active") ?? null;

  const stageNames = [...new Set(phases.map((p) => p.stage))];
  const stages = stageNames.map((stage) => {
    const group = phases.filter((p) => p.stage === stage);
    const done = group.filter((p) => p.charge >= 1).length;
    const charge =
      group.length === 0
        ? 0
        : Math.round(
            (group.reduce((a, p) => a + p.charge, 0) / group.length) * 1000,
          ) / 10;
    return { stage, chargePct: charge, done, total: group.length };
  });

  return { phases, chargePct, doneCount, partialCount, active, stages };
}
