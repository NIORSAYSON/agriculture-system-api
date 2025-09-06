# Seller Order Management API Documentation

## Overview

This API provides secure order management functionality for sellers, ensuring that sellers can only view and manage orders that contain their products.

## Security Features

- **Product Ownership Validation**: Sellers can only access orders containing their products
- **Role-based Access Control**: Only authenticated sellers can access seller endpoints
- **Order Isolation**: Each seller sees only their portion of multi-seller orders
- **Stock Validation**: Real-time stock checking before order placement
- **Seller Status Verification**: Orders can only be placed for active sellers

## API Endpoints

### 1. Get Seller Orders

**GET** `/api/order/seller`

**Headers:**

```
Authorization: Bearer <seller_token>
```

**Query Parameters:**

- `limit` (optional): Number of orders per page (default: 10)
- `page` (optional): Page number (default: 1)
- `status` (optional): Filter by order status (Processing, In Transit, Delivered, Cancelled)

**Response:**

```json
{
  "message": "Seller orders retrieved successfully",
  "orders": [
    {
      "orderId": "12345678",
      "status": "Processing",
      "user": {
        "firstname": "John",
        "lastname": "Doe",
        "mobile_number": "+1234567890",
        "email": "john@example.com"
      },
      "products": [
        {
          "product": {
            "_id": "product_id",
            "name": "Product Name",
            "image": "image_url",
            "price": 25.99,
            "seller_id": "seller_id"
          },
          "quantity": 2
        }
      ],
      "sellerTotal": 51.98,
      "shippingAddress": {...},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "countOrders": 10,
  "currentPage": 1,
  "totalPages": 2
}
```

### 2. Update Order Status

**PUT** `/api/order/seller/:orderId/status`

**Headers:**

```
Authorization: Bearer <seller_token>
```

**Body:**

```json
{
  "status": "In Transit"
}
```

**Valid Status Values:**

- "Processing"
- "In Transit"
- "Delivered"
- "Cancelled"

**Response:**

```json
{
  "message": "Order status updated successfully",
  "order": {
    "orderId": "12345678",
    "status": "In Transit"
  }
}
```

### 3. Get Seller Order Statistics

**GET** `/api/order/seller/stats`

**Headers:**

```
Authorization: Bearer <seller_token>
```

**Response:**

```json
{
  "message": "Seller statistics retrieved successfully",
  "stats": {
    "totalOrders": 45,
    "totalRevenue": 1250.75,
    "ordersByStatus": {
      "Processing": 5,
      "In Transit": 8,
      "Delivered": 30,
      "Cancelled": 2
    },
    "recentOrders": [
      {
        "orderId": "12345678",
        "status": "Processing",
        "customerName": "John Doe",
        "totalAmount": 51.98,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 4. Get Order Details

**GET** `/api/order/:orderId`

**Headers:**

```
Authorization: Bearer <token>
```

**Notes:**

- Buyers can only view their own orders
- Sellers can only view orders containing their products
- Sellers will only see their products within mixed-seller orders

**Response for Sellers:**

```json
{
  "message": "Order details retrieved successfully",
  "order": {
    "orderId": "12345678",
    "status": "Processing",
    "user": {
      "firstname": "John",
      "lastname": "Doe",
      "mobile_number": "+1234567890",
      "email": "john@example.com"
    },
    "products": [
      // Only products belonging to this seller
    ],
    "sellerTotal": 51.98,
    "shippingAddress": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Enhanced Order Placement Security

### Place Order (Enhanced)

**POST** `/api/order/placeOrder`

**Security Enhancements:**

- Validates all products are available and active
- Verifies all product sellers are active
- Checks real-time stock availability
- Ensures seller_id exists for all products

### Buy Now (Enhanced)

**POST** `/api/order/buyNow`

**Security Enhancements:**

- Validates product availability and seller status
- Real-time stock verification
- Seller existence and status validation

## Error Responses

### 403 Forbidden

```json
{
  "message": "Access denied. You can only manage orders for your own products."
}
```

### 400 Bad Request (Stock)

```json
{
  "message": "Insufficient stock for Product Name. Available: 5, Requested: 10"
}
```

### 400 Bad Request (Seller Inactive)

```json
{
  "message": "Product seller is not available"
}
```

### 404 Not Found

```json
{
  "message": "Order not found"
}
```

## Real-time Notifications

### Seller Notifications

- New order notifications via WebSocket
- Real-time updates when orders are placed

### Buyer Notifications

- Order status update notifications
- Delivered via WebSocket to user room

## Data Flow

1. **Order Placement**:

   - Validates products and sellers
   - Creates order with proper seller linkage
   - Notifies relevant sellers
   - Deducts stock from products

2. **Seller Order Retrieval**:

   - Filters orders by seller's products
   - Calculates seller-specific totals
   - Returns only relevant order data

3. **Status Updates**:
   - Validates seller ownership
   - Updates order status
   - Notifies buyer via real-time events

## Database Considerations

### Order Model

- `products.product` references Product model
- Product model includes `seller_id` field
- Orders support multiple products from different sellers

### Security Indexes

Recommended indexes for performance:

```javascript
// Orders by seller products
db.orders.createIndex({ "products.product": 1, deleted_at: 1 });

// Orders by status for sellers
db.orders.createIndex({ "products.product": 1, status: 1, deleted_at: 1 });
```
