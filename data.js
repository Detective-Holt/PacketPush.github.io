/* ============================================================
   EDIT THIS FILE to update the site.
   Items marked  draft: true   show a "Draft" tag (remove it when you're happy).
   Figures in the posts come from your final reports - keep them matching your CV.
   ============================================================ */

const SITE = {
  brand: "PacketPush",                 // site name shown in the header
  name: "Bruce Mpepoimba",
  tagline: "Notes, lab write-ups and projects from my journey into network engineering.",
  email: "fbm165@gmail.com",
  github: "https://github.com/Detective-Holt",
  linkedin: "https://www.linkedin.com/in/gaai/",
  footerBlurb: "Sharing what I learn on the road to becoming a network engineer."
};

const POSTS = [
  /* ---------------------------------------------------------- GRIMES */
  {
    slug: "grimes-ip-reputation-firewall",
    title: "GRIMES: Automating a Linux Firewall with Threat Intelligence",
    category: "Network Security",
    date: "2026-10-07",
    read: 8,
    image: "images/grimes-cover.jpg",
    excerpt: "My final-year project: a Python system that pulls eight threat intelligence feeds, validates the IPs and turns them into iptables rules automatically, plus what I would change in version 2.",
    content: `
<p><strong>GRIMES</strong> (Global Reputation-based Intrusion Mitigation and Enforcement System) was my final-year project for my BSc in Computer Networks. The goal: stop traffic from IP addresses already known to be malicious, such as botnet nodes, scanners and brute-forcers, <em>before</em> they can touch a network, without anyone having to maintain the blocklist by hand.</p>

<h2>The problem</h2>
<p>Botnets are behind a large share of DDoS activity, and the IPs they use change constantly. Public threat intelligence feeds track these addresses, but turning a feed into firewall rules is a manual, repetitive job. Small organisations rarely have the time or staff to keep it current. I wanted something lightweight that runs on its own on an ordinary Linux box.</p>

<h2>How it works</h2>
<p>GRIMES is a single Python script built from four modules, scheduled with <code>cron</code> to run daily (I used 02:00, outside peak hours).</p>
<ol>
  <li><strong>Collect:</strong> downloads blocklists from eight public feeds (including Spamhaus DROP, FireHOL Level 1, abuse.ch Feodo Tracker and blocklist.de). Each request has a 10-second timeout, and a failed feed is logged and skipped rather than stopping the run.</li>
  <li><strong>Validate:</strong> strips comments and blank lines and keeps only valid IPv4 addresses, using Python's <code>ipaddress</code> module. Duplicates disappear because results are stored in a set.</li>
  <li><strong>Enforce:</strong> builds a dedicated iptables chain called <code>BLACKHOLE</code>, sends <code>INPUT</code> traffic through it and adds a <code>DROP</code> rule per IP. A whitelist makes sure critical addresses (for example your own DNS servers) are never blocked.</li>
  <li><strong>Log:</strong> every step writes a timestamped entry, so you can see what was fetched, how much was filtered out and how many rules were applied.</li>
</ol>
<figure class="tall"><img src="images/grimes-flowchart.jpg" alt="Flowchart of the GRIMES system showing data collection, data processing and firewall integration stages"><figcaption>System flowchart: collection → validation → firewall integration.</figcaption></figure>

<p>The validation step is one line of Python doing a lot of work:</p>
<pre><code>ips = {line.strip() for line in f
       if line.strip()
       and not line.startswith(('#', ';'))
       and is_valid_ipv4(line.strip())}</code></pre>

<p>And the enforcement step, simplified:</p>
<pre><code>iptables -N BLACKHOLE                 # dedicated chain
iptables -A INPUT -j BLACKHOLE        # send inbound traffic through it
iptables -A BLACKHOLE -j RETURN       # default: carry on to normal rules
iptables -I BLACKHOLE 1 -s &lt;ip&gt; -j DROP   # one rule per bad IP</code></pre>
<p>Using a separate chain keeps the blocklist apart from any other firewall rules and makes it easy to inspect with <code>iptables -L BLACKHOLE</code>.</p>
<figure><img src="images/grimes-blackhole-chain.jpg" alt="Terminal output of iptables -L showing the BLACKHOLE chain populated with DROP rules"><figcaption>The BLACKHOLE chain after a run.</figcaption></figure>

<h2>Testing</h2>
<p>I tested in an isolated Ubuntu 24.04 virtual machine across four areas: functional, performance, security and resilience. Results from the run on 4 April 2025:</p>
<table>
  <tr><th>Test</th><th>Result</th></tr>
  <tr><td>IPs collected from 8 feeds</td><td>44,392</td></tr>
  <tr><td>Valid IPv4 after filtering</td><td>38,488 (about 13% removed)</td></tr>
  <tr><td>Firewall rules applied</td><td>38,488</td></tr>
  <tr><td>Full run time (average of 5 runs)</td><td>48.17 seconds</td></tr>
  <tr><td>Uptime over a 48-hour test</td><td>99.9%</td></tr>
  <tr><td>One or more feeds unavailable</td><td>Carried on with the remaining feeds</td></tr>
  <tr><td>Corrupted blocklist file</td><td>Logged the error and exited safely</td></tr>
</table>
<figure><img src="images/grimes-execution-times.jpg" alt="Log file showing five GRIMES runs between 47.67 and 48.71 seconds"><figcaption>Five timed runs, 47.67 to 48.71 seconds.</figcaption></figure>

<p>For the security tests I generated traffic from <strong>20 known-bad IPs</strong> (taken from the feeds), <strong>10 legitimate IPs</strong>, and a <strong>mixed set of 30</strong>, aimed at a test web server, SSH and Telnet. All 20 malicious sources were dropped and all legitimate traffic got through, so 0 false positives <em>in that test set</em>. The packet counters below show 20 packets dropped against each test IP.</p>
<figure><img src="images/grimes-packet-count.jpg" alt="iptables counters showing 20 packets dropped for each of the test IP addresses"><figcaption>iptables packet counters after the malicious-traffic test.</figcaption></figure>
<p>Resource-wise, CPU usage rose by about 30 percentage points during a run and memory by about 1.5 points. That's a short spike, which is acceptable for a job that runs once a day.</p>

<h2>What I'd change in version 2</h2>
<p>Looking back with fresh eyes, there are clear improvements I'd make:</p>
<ul>
  <li><strong>Don't flush the whole firewall.</strong> Version 1 starts with <code>iptables -F</code>, which clears <em>every</em> rule on the host, not just GRIMES's. On a real server that would wipe existing protections. Version 2 should only flush and rebuild the BLACKHOLE chain.</li>
  <li><strong>Use ipset.</strong> Adding ~38,000 individual rules one subprocess call at a time is slow, and iptables checks rules in order. Loading the IPs into an <code>ipset</code> hash set and matching it with a single rule is far faster for both loading and packet lookups.</li>
  <li><strong>Swap atomically.</strong> Build the new set, then swap it in, so there's never a moment with no protection during an update.</li>
  <li><strong>Support IPv6 and CIDR ranges.</strong> Version 1 only handles single IPv4 addresses. Several feeds (Spamhaus DROP, FireHOL) publish whole network ranges, which v1 discards.</li>
  <li><strong>Move to nftables</strong>, which is now the default on most modern distributions.</li>
  <li><strong>Add expiry and a small dashboard</strong> so stale entries age out and blocked traffic is easy to see.</li>
</ul>

<h2>What I learned</h2>
<p>Building something that works in a lab is the easy part. Making it <em>safe to run on a real network</em> is the harder and more interesting problem. Error handling, whitelisting and logging took more thought than the core logic, and they are exactly what decide whether a tool like this helps or hurts in production.</p>`
  },

  /* ---------------------------------------------------------- ITA routing */
  {
    slug: "ospf-eigrp-bgp-case-study",
    title: "Designing OSPF, EIGRP and BGP for a Multi-Site Network",
    category: "Routing & Design",
    date: "2026-10-06",
    read: 9,
    excerpt: "A routing case study for a fictional travel agency: multi-area OSPF, EIGRP across four autonomous systems, and BGP path control, all dual-stack IPv4/IPv6 and tested.",
    content: `
<p>For my Advanced Network Protocols module (December 2024) I designed, configured and tested three routing scenarios for a fictional company, <em>International Travel Agency</em> (ITA). Each used the same three-router topology and a shared IPv4/IPv6 addressing plan, but a different routing protocol. The brief asked not just for connectivity but for <strong>security and optimisation features</strong>, each one justified and tested.</p>

<h2>Addressing plan</h2>
<p>I subnetted 192.168.9.0/24 by need: a /27 and a /28 for the two LANs, /30s for the three serial links and the loopbacks. Each subnet got a matching IPv6 /64 from 2001:DB8::/32, and the LANs hand out addresses with DHCP (IPv4) and stateless DHCPv6 (IPv6).</p>

<h2>Case 1: Multi-area OSPF</h2>
<p>The network was split into four areas (0, 14, 26 and 1235), with Area 0 as the backbone. OSPFv2 and OSPFv3 ran side by side for IPv4 and IPv6.</p>
<ul>
  <li><strong>Totally stubby areas:</strong> Areas 14 and 26 sit at the edge, so I made them totally stubby. Their routers only receive a default route instead of the full inter-area table.</li>
  <li><strong>MD5 authentication</strong> on every OSPFv2 adjacency, so a rogue router can't inject routes. I tested this by removing the key on one side and confirming the adjacency dropped. (OSPFv3 would need IPsec, which two of the routers didn't support, so I recommended a firmware upgrade.)</li>
  <li><strong>LSA overload protection</strong> (<code>max-lsa</code>) so a misbehaving neighbour can't exhaust router memory.</li>
  <li><strong>BFD</strong> (50 ms intervals × 3) for sub-second link failure detection instead of waiting for the 40-second dead timer.</li>
  <li><strong>Passive interfaces by default</strong>, enabling OSPF only on the serial links.</li>
</ul>
<pre><code>bfd-template single-hop ITA_FAILURE
 interval min-tx 50 min-rx 50 multiplier 3
!
router ospf 1
 router-id 1.1.1.1
 max-lsa 500
 passive-interface default
 no passive-interface Serial0/1/0
 no passive-interface Serial0/1/1
 area 14 stub no-summary
 area 0 authentication message-digest
 bfd all-interfaces</code></pre>

<h2>Case 2: EIGRP across four autonomous systems</h2>
<p>This was the trickiest scenario. The topology had four EIGRP autonomous systems (10, 20, 100 and 200), and routers in different AS numbers can't form adjacencies at all, yet the company wanted full connectivity.</p>
<ul>
  <li><strong>Named EIGRP</strong>, which keeps IPv4 and IPv6 configuration in one place.</li>
  <li><strong>Mutual redistribution</strong> between the AS numbers on the border routers.</li>
  <li><strong>Loop prevention with route tags.</strong> Redistributing in both directions risks routes looping back into the AS they came from. I tagged routes as they were redistributed (for example tag 10 for routes from AS 10) and used route-maps to deny them from being redistributed back in.</li>
  <li><strong>Stub routing</strong> on the edge AS numbers to limit query propagation.</li>
  <li><strong>MD5 authentication</strong> with a shared key chain.</li>
</ul>
<pre><code>route-map RE_10_TO_100 permit 10
 set tag 10
!
route-map NO_10 deny 10
 match tag 10
!
router eigrp R1_AS200
 address-family ipv4 unicast autonomous-system 200
  topology base
   redistribute eigrp 10 route-map NO_10
   redistribute eigrp 100 route-map RE_100_TO_200</code></pre>
<p>Testing confirmed redistributed routes appeared with administrative distance 170 and carried the right tags in <code>show ip eigrp topology</code>.</p>

<h2>Case 3: BGP with path control</h2>
<p>R1 and R3 formed AS 200 (iBGP between them) and R2 played the ISP in AS 100 (eBGP to both). The requirement: traffic between the two AS numbers should prefer the faster <strong>T3</strong> link, with the <strong>T1</strong> link as backup.</p>
<ul>
  <li><strong>Local preference 300</strong> on routes learned over the T3 link, so it's chosen first.</li>
  <li><strong>AS-path prepending</strong> on routes sent over the T1 link, so it looks longer and less attractive from the other direction too.</li>
  <li><strong>Security from NSA BGP guidance:</strong> neighbour passwords, TTL security, and a <code>maximum-prefix</code> limit to protect against a neighbour flooding routes.</li>
</ul>
<pre><code>route-map T3_First permit 10
 set local-preference 300
!
route-map T1_SEC permit 10
 set as-path prepend 100 100 100
!
router bgp 100
 neighbor &lt;R3&gt; route-map T3_First in
 neighbor &lt;R1&gt; route-map T1_SEC out
 neighbor &lt;R1&gt; maximum-prefix 12 80 restart 60</code></pre>
<p>A traceroute confirmed traffic used the T3 link. When I shut the T3 interface, traffic failed over to the T1 link as intended.</p>

<h2>Testing approach</h2>
<p>Every feature had a test-plan entry: what, where, the command, the expected result and the actual result. Each case ended with end-to-end ping tests over both IPv4 and IPv6. Writing the expected result <em>before</em> running the command made me think harder about what each feature should actually change.</p>

<h2>What I learned</h2>
<ul>
  <li>Redistribution is where routing designs get fragile. Tags and route-maps aren't optional extras.</li>
  <li>Security features are cheap to add and easy to test, so there's no reason to leave a routing protocol unauthenticated.</li>
  <li>Small BGP attributes (local preference, AS-path length) give you a lot of control over traffic in both directions.</li>
</ul>
<p><em>Passwords and keys are removed from the configuration snippets above.</em></p>`
  },

  /* ---------------------------------------------------------- CCNA */
  {
    slug: "my-ccna-journey",
    title: "My CCNA Journey: Plan and Progress",
    category: "Learning",
    date: "2026-10-03",
    read: 3,
    excerpt: "Where I am with the CCNA, how I'm studying, and how I plan to document my labs here.",
    draft: true,
    content: `
<p>After graduating with a First in BSc Computer Networks from Anglia Ruskin University, I'm now working towards the CCNA. University covered a lot of the material, from VLANs and STP to OSPF and ACLs, so the CCNA is about filling gaps and getting fast and confident at the command line.</p>
<h2>The plan</h2>
<ul>
  <li>Work through each CCNA topic with hands-on labs rather than just reading.</li>
  <li>Write up the labs here so the learning is visible and useful to others.</li>
  <li>Share what goes wrong as well as what works.</li>
</ul>
<h2>Still to add</h2>
<p>Your study resources, lab tools, target exam date and the first topic you'll cover.</p>`
  }
];

const PROJECTS = [
  {
    title: "GRIMES: Automated IP Reputation Firewall",
    status: "Final-year project · Submitted April 2025",
    image: "images/grimes-cover.jpg",
    desc: "Python system that pulls 8 threat intelligence feeds, validates the IPs and applies them as iptables DROP rules on a schedule. In testing it loaded 38,488 rules in about 48 seconds and blocked all 20 test attack sources with no false positives.",
    tags: ["Python", "iptables", "Linux", "Cron", "Threat intelligence"],
    post: "grimes-ip-reputation-firewall",
    link: ""
  },
  {
    title: "Multi-Protocol Routing Design (OSPF, EIGRP, BGP)",
    status: "Advanced Network Protocols · December 2024",
    desc: "Designed, configured and tested three dual-stack routing scenarios: multi-area OSPF with totally stubby areas and BFD, EIGRP across four AS with tagged redistribution, and BGP path control using local preference and AS-path prepending.",
    tags: ["OSPF", "EIGRP", "BGP", "IPv6", "BFD", "Cisco IOS"],
    post: "ospf-eigrp-bgp-case-study",
    link: ""
  },
  {
    title: "GÉANT Geneva PoP Network Design",
    status: "Group live brief · Led a team of 3 · 2024",
    desc: "Elected group leader. Two-tier network design for a simulated Geneva point of presence. I wrote the design for the redundancy (RSTP, LACP EtherChannel, HSRP), switch hardening, extended ACLs and the site-to-site IPsec VPN, wrote all the test plans, and helped build it in Packet Tracer.",
    tags: ["Packet Tracer", "RSTP", "EtherChannel", "HSRP", "IPsec VPN", "ACLs", "AAA"],
    link: ""
  },
  {
    title: "Black-Box Penetration Test",
    status: "Ethical Hacking · December 2024",
    desc: "Penetration test of three servers in a university lab environment, run in five phases (reconnaissance, scanning, analysis, verification, risk mitigation) and written up as a client report with prioritised countermeasures.",
    tags: ["Kali Linux", "Nmap", "OpenVAS", "Hydra", "Risk analysis"],
    link: ""
  },
  {
    title: "SDN and Network Automation Evaluation",
    status: "Advanced Networking Technologies · April 2025",
    desc: "Evaluated SDN for enterprises and ISPs and compared automation tools, with working code. The code repository is being moved to my GitHub.",
    tags: ["SDN", "Python", "Netmiko", "Ansible", "Jinja2", "Mininet", "OpenFlow"],
    link: ""
  },
  {
    title: "This Website",
    status: "Live",
    desc: "A static portfolio and blog hosted free on GitHub Pages and deployed straight from a Git repository.",
    tags: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    link: ""
  }
];

const JOURNEY = [
  { type: "Milestone", date: "Oct 2026", title: "Started this blog", desc: "Launched this site to document what I'm learning and the projects I build." },
  { type: "Learning", date: "Ongoing", title: "Pursuing CCNA certification", desc: "Working towards the Cisco Certified Network Associate while building hands-on labs." },
  { type: "Career", date: "Jul 2025 – Present", title: "Shift Supervisor, Gonville Hotel", desc: "Direct team operations during high-volume services and corporate functions, and propose workflow improvements." },
  { type: "Education", date: "May 2025", title: "BSc Computer Networks, First Class", desc: "Graduated from Anglia Ruskin University, Cambridge." },
  { type: "Project", date: "Apr 2025", title: "Final project: GRIMES", desc: "Built and tested an automated IP reputation firewall in Python and iptables." },
  { type: "Project", date: "Dec 2024", title: "Routing design and penetration test", desc: "Multi-protocol routing case study (OSPF, EIGRP, BGP) and a black-box penetration test of three servers." },
  { type: "Project", date: "Apr 2024", title: "GÉANT live brief: group leader", desc: "Elected leader of a 3-person team designing a secure, redundant network for a simulated Geneva point of presence." },
  { type: "Volunteering", date: "Sept 2023 – Jan 2024", title: "Welcome Buddy, Anglia Ruskin University", desc: "Supported six new students in settling into university life and campus resources." }
];

const ABOUT = {
  heading: "Hello! I'm Bruce, an aspiring Network Engineer",
  paragraphs: [
    "I graduated in May 2025 with a First in BSc Computer Networks from Anglia Ruskin University in Cambridge. For my final project I built GRIMES, a Python system that automatically turns threat intelligence feeds into Linux firewall rules. I've also designed multi-protocol routing (OSPF, EIGRP and BGP) and led a team designing a secure, redundant network for a simulated GÉANT site.",
    "I enjoy routing, network security and automating the repetitive parts of running a network, and I'm looking to contribute to environments where reliability and availability matter. I'm currently working towards my CCNA.",
    "Through this blog I document labs, projects and what's happening in the networking world, so my learning is visible and useful to others."
  ],
  skills: ["TCP/IP", "Subnetting (IPv4/IPv6)", "VLANs", "STP/RSTP", "EtherChannel", "HSRP", "OSPF", "EIGRP", "BGP", "IS-IS", "IPsec VPN", "ACLs", "QoS", "Wireshark", "Nmap", "OpenVAS", "SolarWinds", "Python", "Linux / iptables", "Cisco IOS", "Packet Tracer"],
  certs: [
    "BSc Computer Networks, First Class: Anglia Ruskin University (May 2025)",
    "CCNA: currently pursuing"
  ]
};
