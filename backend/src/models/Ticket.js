const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Ticket title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technical Issue',
      'Software Installation',
      'Hardware Problem',
      'Network Issue',
      'Account Access',
      'Email Problem',
      'Printer Issue',
      'Mobile Device',
      'Security Concern',
      'Training Request',
      'General Inquiry',
      'Other'
    ]
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Waiting for Response', 'Resolved', 'Closed'],
    default: 'Open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution cannot exceed 1000 characters']
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  estimatedResolutionTime: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  impact: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    
    // Find the last ticket created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const lastTicket = await this.constructor.findOne({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequenceNumber = 1;
    if (lastTicket && lastTicket.ticketNumber) {
      const lastSequence = parseInt(lastTicket.ticketNumber.split('-')[3]);
      sequenceNumber = lastSequence + 1;
    }
    
    this.ticketNumber = `TKT-${year}${month}${day}-${String(sequenceNumber).padStart(4, '0')}`;
  }
  next();
});

// Update resolved/closed timestamps based on status
ticketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status === 'Closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Virtual for ticket age
ticketSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for response time (if resolved)
ticketSchema.virtual('resolutionTimeInHours').get(function() {
  if (this.resolvedAt) {
    const diffTime = Math.abs(this.resolvedAt - this.createdAt);
    return Math.round(diffTime / (1000 * 60 * 60));
  }
  return null;
});

// Ensure virtuals are included in JSON
ticketSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
