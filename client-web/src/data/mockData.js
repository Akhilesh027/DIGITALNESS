export const MOCK_CLIENT = {
  _id: "client-6701",
  name: "Rajesh Sharma",
  email: "rajesh@innovatebrands.in",
  phone: "+91 98765 43210",
  businessType: "E-Commerce & Retail",
  branchId: "Bangalore HSR Branch",
  status: "active",
};

export const MOCK_CUSTOMER = {
  _id: "cust-9901",
  name: "Innovate Brands Pvt Ltd",
  email: "contact@innovatebrands.in",
  phone: "+91 80 4123 9876",
  contactNumbers: ["+91 98765 43210", "+91 80 4123 9876"],
  businessType: "D2C Health & Wellness",
  city: "Bangalore",
  address: "Sector 3, HSR Layout, Bengaluru, Karnataka 560102",
  package: "Growth Enterprise 360",
  monthlyRetainer: 75000,
  contractStart: "2026-01-15",
  contractEnd: "2026-12-31",
};

export const MOCK_WORKS = [
  {
    _id: "work-101",
    title: "E-Commerce Website Revamp & SEO Overhaul",
    workType: "Web Development & SEO",
    status: "In Progress",
    priority: "High",
    description: "Complete design rebuild of Shopify store with sub-second page speeds, schema markup, and on-page technical SEO optimization.",
    slaDays: 21,
    deliverables: 8,
    completedDeliverables: 5,
    dueDate: "2026-10-18T18:30:00.000Z",
    assignedTo: [
      {
        _id: "user-1",
        name: "Arun Kumar",
        email: "arun.k@digitalness.co.in",
        phone: "+91 98451 12345",
        role: "Frontend Dev Lead",
        department: "Engineering"
      },
      {
        _id: "user-2",
        name: "Pooja Hegde",
        email: "pooja.h@digitalness.co.in",
        phone: "+91 97312 67890",
        role: "UI/UX Designer",
        department: "Creative Studio"
      }
    ],
    tasks: [
      {
        _id: "task-101-1",
        title: "Mobile-first UI wireframes & Figma prototypes",
        status: "Completed",
        priority: "High",
        dueDate: "2026-10-05T18:30:00.000Z"
      },
      {
        _id: "task-101-2",
        title: "Liquid Shopify custom theme development",
        status: "In Progress",
        priority: "Urgent",
        dueDate: "2026-10-12T18:30:00.000Z"
      },
      {
        _id: "task-101-3",
        title: "Core Web Vitals & lazy loading speed audit",
        status: "Review",
        priority: "Medium",
        dueDate: "2026-10-15T18:30:00.000Z"
      }
    ]
  },
  {
    _id: "work-102",
    title: "Diwali Festive Ad Campaigns & Meta Ads Scaling",
    workType: "Performance Marketing",
    status: "Review",
    priority: "Urgent",
    description: "Targeted Meta & Google Shopping ads with custom audience cohorts, ROAS tracking, and carousel festive creatives.",
    slaDays: 14,
    deliverables: 12,
    completedDeliverables: 10,
    dueDate: "2026-10-10T18:30:00.000Z",
    assignedTo: [
      {
        _id: "user-3",
        name: "Vikram Malhotra",
        email: "vikram.m@digitalness.co.in",
        phone: "+91 99001 54321",
        role: "Performance Marketer",
        department: "Paid Growth"
      }
    ],
    tasks: [
      {
        _id: "task-102-1",
        title: "Festive promo banner pack (15 variations)",
        status: "Completed",
        priority: "High",
        dueDate: "2026-10-04T18:30:00.000Z"
      },
      {
        _id: "task-102-2",
        title: "Pixel conversion API tracking & catalogue sync",
        status: "Completed",
        priority: "Urgent",
        dueDate: "2026-10-06T18:30:00.000Z"
      },
      {
        _id: "task-102-3",
        title: "A/B copy headline testing & retargeting funnel",
        status: "Review",
        priority: "High",
        dueDate: "2026-10-09T18:30:00.000Z"
      }
    ]
  },
  {
    _id: "work-103",
    title: "Brand Content Calendar & Social Media Management",
    workType: "Content & Social",
    status: "Completed",
    priority: "Medium",
    description: "24 monthly Instagram Reels, carousel educational posts, and community engagement moderation.",
    slaDays: 30,
    deliverables: 24,
    completedDeliverables: 24,
    dueDate: "2026-09-30T18:30:00.000Z",
    assignedTo: [
      {
        _id: "user-4",
        name: "Sneha Reddy",
        email: "sneha.r@digitalness.co.in",
        phone: "+91 96112 34567",
        role: "Content Strategist",
        department: "Content Operations"
      }
    ],
    tasks: [
      {
        _id: "task-103-1",
        title: "Reel script writing & hook ideation",
        status: "Completed",
        priority: "Medium",
        dueDate: "2026-09-15T18:30:00.000Z"
      },
      {
        _id: "task-103-2",
        title: "Video editing & color grading batch 1-12",
        status: "Completed",
        priority: "Medium",
        dueDate: "2026-09-22T18:30:00.000Z"
      }
    ]
  },
  {
    _id: "work-104",
    title: "Google Local Search Pack & WhatsApp Funnel Setup",
    workType: "Local SEO & CRM",
    status: "Pending",
    priority: "Low",
    description: "Optimizing Google Business Profile citations, WhatsApp automated order updates, and customer review acquisition.",
    slaDays: 10,
    deliverables: 4,
    completedDeliverables: 0,
    dueDate: "2026-10-25T18:30:00.000Z",
    assignedTo: [
      {
        _id: "user-5",
        name: "Karan Johar",
        email: "karan.j@digitalness.co.in",
        phone: "+91 91081 99887",
        role: "SEO Analyst",
        department: "Search Marketing"
      }
    ],
    tasks: []
  },
  {
    _id: "work-105",
    title: "Packaging Label Design for New Product Line",
    workType: "Graphic Design",
    status: "Revision",
    priority: "High",
    description: "CMYK print-ready packaging labels for whey protein & energy bars as per FSSAI regulations.",
    slaDays: 7,
    deliverables: 3,
    completedDeliverables: 2,
    dueDate: "2026-10-14T18:30:00.000Z",
    assignedTo: [
      {
        _id: "user-2",
        name: "Pooja Hegde",
        email: "pooja.h@digitalness.co.in",
        phone: "+91 97312 67890",
        role: "UI/UX Designer",
        department: "Creative Studio"
      }
    ],
    tasks: []
  }
];

export const MOCK_ATTACHMENTS = [
  {
    _id: "att-1",
    title: "Innovate_Brand_Style_Guide_2026.pdf",
    category: "Brand Guidelines",
    fileSize: "4.8 MB",
    uploadedAt: "2026-09-12T10:30:00Z",
    downloadUrl: "#",
    status: "Verified",
    uploadedBy: "Rajesh Sharma",
  },
  {
    _id: "att-2",
    title: "Vector_Master_Logo_Suite.zip",
    category: "Brand Assets",
    fileSize: "18.2 MB",
    uploadedAt: "2026-09-14T14:15:00Z",
    downloadUrl: "#",
    status: "Verified",
    uploadedBy: "Rajesh Sharma",
  },
  {
    _id: "att-3",
    title: "Diwali_Offer_Copy_And_Discounts.docx",
    category: "Campaign Copy",
    fileSize: "1.2 MB",
    uploadedAt: "2026-10-01T09:45:00Z",
    downloadUrl: "#",
    status: "In Review",
    uploadedBy: "Rajesh Sharma",
  },
  {
    _id: "att-4",
    title: "Product_Catalogue_HiRes_Photos.zip",
    category: "Product Images",
    fileSize: "42.6 MB",
    uploadedAt: "2026-09-28T16:20:00Z",
    downloadUrl: "#",
    status: "Verified",
    uploadedBy: "Innovate Team",
  },
];

export const MOCK_PAYMENTS = [
  {
    _id: "inv-2026-009",
    invoiceNumber: "DGT-2026-1082",
    date: "2026-10-01",
    dueDate: "2026-10-15",
    description: "Monthly Digital Marketing & SEO Retainer - October 2026",
    amount: 75000,
    tax: 13500,
    total: 88500,
    status: "Pending",
  },
  {
    _id: "inv-2026-008",
    invoiceNumber: "DGT-2026-0941",
    date: "2026-09-01",
    dueDate: "2026-09-15",
    description: "Monthly Digital Marketing & SEO Retainer - September 2026",
    amount: 75000,
    tax: 13500,
    total: 88500,
    status: "Paid",
    paidAt: "2026-09-08",
    paymentMode: "NEFT / Bank Transfer",
    referenceId: "CMS7892348910",
  },
  {
    _id: "inv-2026-007",
    invoiceNumber: "DGT-2026-0814",
    date: "2026-08-01",
    dueDate: "2026-08-15",
    description: "Monthly Digital Marketing & SEO Retainer - August 2026",
    amount: 75000,
    tax: 13500,
    total: 88500,
    status: "Paid",
    paidAt: "2026-08-05",
    paymentMode: "UPI / Razorpay",
    referenceId: "pay_N8s93kd02934",
  },
];
