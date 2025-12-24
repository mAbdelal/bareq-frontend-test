const academicStatusLabels = {
    high_school_student: "طالب في المدرسة الثانوية",
    high_school_graduate: "خريج مدرسة ثانوية",
    bachelor_student: "طالب بكالوريوس",
    bachelor: "خريج بكالوريوس",
    master_student: "طالب ماجستير",
    master: "خريج ماجستير",
    phd_candidate: "طالب دكتوراه",
    phd: "خريج دكتوراه",
    alumni: "خريج",
    researcher: "باحث",
    other: "أخرى",
};

export function translateAcademicStatus(status) {
    return academicStatusLabels[status] || "غير محدد";
}



const requestImplementationRoleLabels = {
    owner: "المالك ",
    provider: "المزود",
    admin: "المشرف",
};


export function translateRequestRole(role) {
    return requestImplementationRoleLabels[role] || "غير محدد";
}


const requestImplementationActionLabels = {
    request_created: "بإنشاء الطلب",
    offer_accepted: "بقبول العرض",
    submit: "بتقديم العمل",
    dispute_provider: "ببدء نزاع كمزود خدمة",
    dispute_owner: "ببدء نزاع كمالك الطلب",
    owner_rejected: "برفض التسليم",
    complete: "بقبول التسليم",

    AdminRefundBuyer: "بإعادة المبلغ للمشتري من قبل المشرف",
    AdminPayProvider: "بدفع المستحقات للمزود من قبل المشرف",
    AdminSplitPayment: "بتقسيم الدفع بين الطرفين من قبل المشرف",
    AdminChargeBoth: "بخصم المبلغ من الطرفين بواسطة المشرف",
    AdminAskRedo: "بطلب إعادة العمل من قبل المشرف",
};



export function translateRequestAction(action) {
    return requestImplementationActionLabels[action] || "غير محدد";
}


const servicePurchaseStatusLabels = {
    pending: "بانتظار قبول المزود",
    provider_rejected: "تم رفض الشراء من قبل المزود",
    in_progress: "قيد التنفيذ من قبل المزود",
    submitted: "تم تسليم العمل من قبل المزود",
    disputed_by_provider: "نزاع بدأه المزود",
    disputed_by_buyer: "نزاع بدأه المشتري",
    completed: "تم إكمال العملية وإغلاقها",
    refused_due_to_timeout:"تجاوزت مهلة اليومان للقبول"
};

export function translateServicePurchaseStatus(status) {
    return servicePurchaseStatusLabels[status] || "غير محدد";
}


// Role labels
const servicePurchaseRoleLabels = {
    buyer: "المشتري",
    provider: "المزود",
    admin: "المشرف",
};

export function translateServicePurchaseRole(role) {
    return servicePurchaseRoleLabels[role] || "غير محدد";
}

// Action labels
const servicePurchaseActionLabels = {
    Purchase: "بإجراء الشراء",
    ProviderAccepted: "بقبول المزود للشراء",
    ProviderRejected: "برفض المزود للشراء",
    ProviderRefusedDueToTimeout: "برفض المزود بسبب انتهاء المهلة",
    Submitted: "بتقديم التسليم",
    DisputeByProvider: "ببدء نزاع من المزود",
    DisputeByBuyer: "ببدء نزاع من المشتري",
    BuyerRejected: "برفض المشتري للتسليم",
    Completed: "بإتمام الطلب",

    AdminRefundBuyer: "بإعادة المبلغ للمشتري من قبل المشرف",
    AdminPayProvider: "بدفع المستحقات للمزود من قبل المشرف",
    AdminSplitPayment: "بتقسيم الدفع بين الطرفين من قبل المشرف",
    AdminChargeBoth: "بخصم المبلغ من الطرفين بواسطة المشرف",
    AdminAskRedo: "بطلب إعادة العمل من قبل المشرف",
};

export function translateServicePurchaseAction(action) {
    return servicePurchaseActionLabels[action] || "غير محدد";
}


const requestStatusLabels = {
    open: "الطلب مفتوح ويقبل العروض",
    in_progress: "المزود يعمل على الطلب",
    submitted: "تم تسليم العمل من قبل المزود",
    disputed_by_provider: "نزاع بدأه المزود",
    disputed_by_owner: "نزاع بدأه صاحب الطلب",
    owner_rejected: "تم رفض التسليم من قبل صاحب الطلب",
    completed: "تم إكمال الطلب",
};

export function translateRequestStatus(status) {
    return requestStatusLabels[status] || "غير محدد";
}


const disputeStatusLabels = {
    open: "النزاع مفتوح",
    under_review: "قيد المراجعة",
    resolved: "تم حل النزاع",
    rejected: "تم رفض النزاع",
};

export function translateDisputeStatus(status) {
    return disputeStatusLabels[status] || "غير محدد";
}
