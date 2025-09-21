import dotenv from "dotenv"
dotenv.config()
import stripe from 'stripe';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);


export const chargeInstallment = async (installment, agreementId) => {
  const agreement = await ServiceAgreement.findById(agreementId)
    .populate('student');

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: installment.amount * 100,
    currency: 'usd',
    customer: agreement.student.stripeCustomerId,
    metadata: { 
      agreementId: agreement._id.toString(),
      installmentId: installment._id.toString() 
    },
    payment_method_types: ['card'],
  });

  installment.stripePaymentIntentId = paymentIntent.id;
  await agreement.save();

  return paymentIntent;
};

export const handleStripeWebhook = async (event) => {
  const paymentIntent = event.data.object;
  
  if (event.type === 'payment_intent.succeeded') {
    const agreement = await ServiceAgreement.findOne({
      'installments.stripePaymentIntentId': paymentIntent.id
    });

    const installment = agreement.installments.find(
      i => i.stripePaymentIntentId === paymentIntent.id
    );

    installment.isPaid = true;
    installment.paymentDate = new Date();
    agreement.paidAmount += installment.amount;
    await agreement.save();
  }
};
export const createCustomer = async (email, name) => {
  return await stripeClient.customers.create({
    email,
    name,
  });
};

export const createSubscription = async (customerId, priceId, paymentMethodId) => {
  await stripeClient.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  return await stripeClient.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    default_payment_method: paymentMethodId,
  });
};