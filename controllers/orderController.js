const Order = require("../models/order");
const Cart = require("../models/addtocart");
const { v4: uuidv4 } = require("uuid");
const { populate } = require("../models/product");

exports.getOrderHistory = async (req, res) => {
  try {
    const sessionId = req.userId; // from token
    console.log("USERID", sessionId);
    // ✅ Use the correct field name

    const orders = await Order.find({
  sessionId,
  status: { $in: ["paid","placed"] }
}).populate("sessionId","name number").sort({ createdAt: -1 });
    res.json({ orders });
    console.log("HistoryOrders", orders);
  } catch (error) {
    console.error("Get Order History Error:", error);
    res.status(500).json({ message: "Error fetching order history", error });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query && req.query.adminStatus) {
      filter.adminStatus = req.query.adminStatus;
    }
    const orders = await Order.find(filter).populate('sessionId','name number').sort({createdAt: -1 });
    console.log("hello")
    console.log("Orders",orders)
    res.json({ orders });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept either `adminStatus` (preferred) or `status` for backward compatibility
    const { adminStatus, status } = req.body;
    const newAdminStatus = adminStatus || status;

    if (!newAdminStatus) {
      return res.status(400).json({ message: "adminStatus is required" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { adminStatus: newAdminStatus }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Error updating order status", error });
  }
};
exports.getAddress = async (req, res) => {
  try {
    const sessionId = req.userId;
    // 1️⃣ Get ALL orders of this user
    const orders = await Order.find({ sessionId })
      .select("Address createdAt")
      .sort({ createdAt: -1 }); // newest first
    if (!orders.length) {
      return res.status(404).json({ message: "No addresses found" });
    }
    // 2️⃣ Extract all addresses
    const addresses = orders.map(o => o.Address);
    // 3️⃣ Remove duplicates ignoring capital/small letters
    const unique = [];
    const keys = new Set();
    for (let addr of addresses) {
      if (!addr) continue;
      const key = `${addr.houseAddress} ${addr.city} ${addr.state} ${addr.postalCode}`
        .toLowerCase()
        .replace(/\s+/g, " ") // remove extra spaces
        .trim();

      if (!keys.has(key)) {
        keys.add(key);
        unique.push(addr);
      }
    }
    const finalAddresses = unique.slice(0,3);

    res.status(200).json({ addresses: finalAddresses });

  } catch (error) {
    console.error("Get Address Error:", error);
    res.status(500).json({ message: "Error fetching address", error });
  }
};

// Render revenue page (admin)
exports.renderRevenuePage = async (req, res) => {
  try {
    // Render page with initial aggregated data (all dates) so page shows data immediately.
    const profitMargin = parseFloat(process.env.PROFIT_MARGIN || '0.20');

    const pipeline = [
      { $match: { status: { $in: ["paid", "placed"] } } },
      {
        $addFields: {
          calculatedAmount: {
            $cond: [
              { $ifNull: ["$amount", false] },
              "$amount",
              {
                $reduce: {
                  input: { $ifNull: ["$products", []] },
                  initialValue: 0,
                  in: { $add: ["$$value", { $multiply: [ { $ifNull: ["$$this.price", 0] }, { $ifNull: ["$$this.quantity", 1] } ] } ] }
                }
              }
            ]
          }
        }
      },
      {
        $project: {
          dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          calculatedAmount: 1
        }
      },
      {
        $group: {
          _id: "$dateStr",
          revenue: { $sum: "$calculatedAmount" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          ordersCount: 1,
          profit: { $multiply: ["$revenue", profitMargin] },
          _id: 0
        }
      }
    ];

    const results = await Order.aggregate(pipeline);
    res.render('revenue', { initialData: results, profitMargin });
  } catch (error) {
    console.error('Render revenue page error:', error);
    res.status(500).send('Error rendering revenue page');
  }
};

// Return aggregated revenue and profit by date
exports.getRevenueData = async (req, res) => {
  try {
    // Optional date range query params (ISO date strings)
    const { startDate, endDate } = req.query;

    const match = {
      // consider only completed/placed/paid orders
      status: { $in: ["paid", "placed"] },
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    // Profit margin (fraction). Default to 0.20 (20%) if not set in env.
    const profitMargin = parseFloat(process.env.PROFIT_MARGIN || '0.20');
    // Calculate amount per order: prefer `amount` field; otherwise sum product price*quantity
    const pipeline = [
      { $match: match },
      {
        $addFields: {
          calculatedAmount: {
            $cond: [
              { $ifNull: ["$amount", false] },
              "$amount",
              {
                $reduce: {
                  input: { $ifNull: ["$products", []] },
                  initialValue: 0,
                  in: { $add: ["$$value", { $multiply: [ { $ifNull: ["$$this.price", 0] }, { $ifNull: ["$$this.quantity", 1] } ] } ] }
                }
              }
            ]
          }
        }
      },
      {
        $project: {
          dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          calculatedAmount: 1
        }
      },
      {
        $group: {
          _id: "$dateStr",
          revenue: { $sum: "$calculatedAmount" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          ordersCount: 1,
          profit: { $multiply: ["$revenue", profitMargin] },
          _id: 0
        }
      }
    ];

    const results = await Order.aggregate(pipeline);

    res.json({ data: results, profitMargin });
  } catch (error) {
    console.error('Get revenue data error:', error);
    res.status(500).json({ message: 'Error fetching revenue data', error });
  }
};




