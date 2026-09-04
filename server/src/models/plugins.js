/** Shared schema options: expose `id`, hide `__v`, keep timestamps. */
export const baseOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.password;
      return ret;
    },
  },
  toObject: { virtuals: true },
};

/** Ordered + publishable content behaves the same everywhere. */
export const orderedFields = {
  order: { type: Number, default: 0, index: true },
  visible: { type: Boolean, default: true, index: true },
};
