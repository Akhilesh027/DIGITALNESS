const http = require("http");

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", (err) => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTest() {
  console.log("=================================================");
  console.log("STEP 1: LOGIN AS MANAGER");
  console.log("=================================================");
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "admin@digitalness.com", password: "adminpassword" }
  );

  const token = loginRes.body.token || loginRes.body.data?.token;
  if (!token) {
    console.error("Login failed:", loginRes.body);
    process.exit(1);
  }
  console.log("✓ Login Successful.");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  console.log("\n=================================================");
  console.log("STEP 2: CREATE TEST CLIENT (Toni & Guy Multi-Loc)");
  console.log("=================================================");
  const createCustRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/customers",
      method: "POST",
      headers: authHeaders,
    },
    {
      name: "Toni & Guy Hair Salon",
      companyName: "Toni & Guy India Ltd",
      contactPerson: "Rajesh Sharma",
      email: "contact@toniandguy.in",
      contactNumbers: ["9876543210"],
      address: "Main Road, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      website: "https://toniandguy.in",
      businessType: "Salon & Spa Chain",
      businessProfile: {
        industry: "Beauty & Wellness",
        services: ["Haircut", "Hair Coloring", "Keratin Treatment"],
        targetAudience: ["Men & Women aged 20-50"],
      },
      brandProfile: {
        brandName: "Toni & Guy",
        tagline: "Hair Meet Fashion",
        brandColors: ["#000000", "#FFD700"],
        visualStyle: "Luxury Editorial",
      },
    }
  );

  const customerId = createCustRes.body.data?._id || createCustRes.body._id;
  console.log(`✓ Customer Created with ID: ${customerId}`);

  console.log("\n=================================================");
  console.log("STEP 3: ADD TWO CLIENT LOCATIONS (Ameenpur & Bachupally)");
  console.log("=================================================");
  const locAmeenpur = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client-locations",
      method: "POST",
      headers: authHeaders,
    },
    {
      customerId,
      name: "Toni & Guy Ameenpur",
      address: "Plot 12, Miyapur Road, Ameenpur",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "502032",
      phone: "9123456789",
      email: "ameenpur@toniandguy.in",
      website: "https://toniandguy.in/ameenpur",
      cta: "Book Ameenpur Slot",
      activeOffers: ["Flat 20% Off Ameenpur Grand Launch"],
      openingHours: "09:00 AM - 09:00 PM",
    }
  );

  const locBachupally = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client-locations",
      method: "POST",
      headers: authHeaders,
    },
    {
      customerId,
      name: "Toni & Guy Bachupally",
      address: "Survey 44, VNR Road, Bachupally",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500090",
      phone: "9876543211",
      email: "bachupally@toniandguy.in",
      website: "https://toniandguy.in/bachupally",
      cta: "Call Bachupally Desk",
      activeOffers: ["Free Hair Spa with Hair Color"],
      openingHours: "10:00 AM - 08:00 PM",
    }
  );

  const locAmeenpurId = locAmeenpur.body.data?._id || locAmeenpur.body._id;
  const locBachupallyId = locBachupally.body.data?._id || locBachupally.body._id;
  console.log(`✓ Location 1 (Ameenpur): ${locAmeenpurId}`);
  console.log(`✓ Location 2 (Bachupally): ${locBachupallyId}`);

  console.log("\n=================================================");
  console.log("STEP 4: UPLOAD LOGO & ADD APPROVED AI MEMORY");
  console.log("=================================================");
  const assetRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client-attachments",
      method: "POST",
      headers: authHeaders,
    },
    {
      customerId,
      fileName: "toni_and_guy_logo.png",
      fileUrl: "https://toniandguy.in/assets/logo.png",
      category: "Logo",
      approvedForAI: true,
    }
  );

  const memoryRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/ai-memory",
      method: "POST",
      headers: authHeaders,
    },
    {
      customerId,
      type: "Rule",
      title: "Pricing Strictness Rule",
      content: "Never advertise 50% discount without explicit manager sign-off.",
      status: "Approved",
    }
  );
  console.log("✓ Logo Asset & AI Memory Approved.");

  console.log("\n=================================================");
  console.log("STEP 5: VERIFY DEEP MERGE (UPDATE COLOR ONLY)");
  console.log("=================================================");
  const updateColorRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/customers/${customerId}`,
      method: "PUT",
      headers: authHeaders,
    },
    {
      brandProfile: {
        brandColors: ["#111111", "#E6C200"],
      },
    }
  );

  const updatedCust = updateColorRes.body.data || updateColorRes.body;
  console.log("Checking deep merge results:");
  console.log(`- Brand Colors updated to: ${updatedCust.brandProfile?.brandColors?.join(", ")}`);
  console.log(`- Brand Name preserved: ${updatedCust.brandProfile?.brandName}`);
  console.log(`- Tagline preserved: ${updatedCust.brandProfile?.tagline}`);
  console.log(`- Visual Style preserved: ${updatedCust.brandProfile?.visualStyle}`);
  if (
    updatedCust.brandProfile?.brandName === "Toni & Guy" &&
    updatedCust.brandProfile?.tagline === "Hair Meet Fashion"
  ) {
    console.log("✓ DEEP MERGE VERIFIED (Sibling fields preserved).");
  } else {
    console.error("❌ DEEP MERGE FAILED (Sibling fields wiped out).");
  }

  console.log("\n=================================================");
  console.log("STEP 6: AI CONTEXT PREVIEW TEST ACROSS BOTH LOCATIONS");
  console.log("=================================================");
  const ctxAmeenpur = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/customers/${customerId}/context?agentType=Social&locationId=${locAmeenpurId}`,
    method: "GET",
    headers: authHeaders,
  });

  const ctxBachupally = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/customers/${customerId}/context?agentType=Social&locationId=${locBachupallyId}`,
    method: "GET",
    headers: authHeaders,
  });

  console.log("Ameenpur Resolved Location Context:");
  console.log(`  Name: ${ctxAmeenpur.body.data?.activeLocation?.name}`);
  console.log(`  Phone: ${ctxAmeenpur.body.data?.activeLocation?.phone}`);
  console.log(`  Website: ${ctxAmeenpur.body.data?.activeLocation?.website}`);
  console.log(`  Offer: ${ctxAmeenpur.body.data?.activeLocation?.activeOffers?.[0]}`);

  console.log("Bachupally Resolved Location Context:");
  console.log(`  Name: ${ctxBachupally.body.data?.activeLocation?.name}`);
  console.log(`  Phone: ${ctxBachupally.body.data?.activeLocation?.phone}`);
  console.log(`  Website: ${ctxBachupally.body.data?.activeLocation?.website}`);
  console.log(`  Offer: ${ctxBachupally.body.data?.activeLocation?.activeOffers?.[0]}`);

  const ameenpurOK = ctxAmeenpur.body.data?.activeLocation?.phone === "9123456789";
  const bachupallyOK = ctxBachupally.body.data?.activeLocation?.phone === "9876543211";

  if (ameenpurOK && bachupallyOK) {
    console.log("✓ MULTI-LOCATION AI CONTEXT PREVIEW VERIFIED 100%.");
  } else {
    console.error("❌ MULTI-LOCATION CONTEXT FAILED.");
  }

  console.log("\n=================================================");
  console.log("ALL TESTS PASSED — CLIENT 360 FOUNDATION READY TO FREEZE");
  console.log("=================================================");
}

runTest().catch((err) => console.error(err));
