frappe.ui.form.on('POS Invoice', {
    refresh: function(frm) {
        if (!frm.doc.__islocal) return;
        if (!frm.doc.posting_date) {
            frappe.throw(__('Posting Date is required'));
        }
        let postingDate = frappe.datetime.str_to_obj(frm.doc.posting_date);
        let day = postingDate.getDate().toString().padStart(2, '0');
        let month = (postingDate.getMonth() + 1).toString().padStart(2, '0');
        let year = postingDate.getFullYear();
        let formatted_date = `${day}-${month}-${year}`;
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "POS Invoice",
                filters: {
                    posting_date: frm.doc.posting_date,
                    docstatus: ["!=", 2], 
                },
                fields: ["name"],
            },
            callback: function(response) {
                if (response.message) {
                    let invoice_count = response.message.length + 1;
                    let final_name = `OACMCTINV ${formatted_date}-`;
                    frm.set_value('naming_series', final_name);
                }
            }
        });
    }
});frappe.ui.form.on('POS Invoice', {
    onload: function(frm) {
        if (!frm.doc.__islocal) {
            console.log("Document is not local, skipping naming_series update.");
            return;
        }

        console.log("onload triggered for new POS Invoice.");
        set_naming_series(frm);
    },
    refresh: function(frm) {
        if (!frm.doc.__islocal) {
            console.log("Document is not local, skipping naming_series update.");
            return;
        }
        console.log("refresh triggered for new POS Invoice.");
        set_naming_series(frm);
    },

    posting_date: function(frm) {
        if (frm.doc.__islocal) {
            console.log("posting_date changed, updating naming_series.");
            set_naming_series(frm);
        }
    }
});
function set_naming_series(frm) {
    if (!frm.doc.posting_date) {
        console.log("Posting Date is missing.");
        frappe.msgprint(__('Posting Date is required'));
        return;
    }
    let postingDate = frappe.datetime.str_to_obj(frm.doc.posting_date);
    let day = postingDate.getDate().toString().padStart(2, '0');
    let month = (postingDate.getMonth() + 1).toString().padStart(2, '0');
    let year = postingDate.getFullYear();
    let formatted_date = `${day}-${month}-${year}`;
    console.log("Formatted Date:", formatted_date);
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "POS Invoice",
            filters: {
                posting_date: frm.doc.posting_date,
                docstatus: ["!=", 2],
            },
            fields: ["name"],
        },
        callback: function(response) {
            console.log("frappe.call response:", response);
            if (response.message) {
                let invoice_count = response.message.length + 1;
                console.log("Invoice Count:", invoice_count);
                let final_name = `OACMCTINV ${formatted_date}-`;
                console.log("Setting naming_series to:", final_name);
                frm.set_value('naming_series', final_name).then(() => {
                    console.log("naming_series set successfully to:", frm.doc.naming_series);
                });
            } else {
                console.log("No response.message received from frappe.call.");
            }
        },
        error: function(err) {
            console.error("frappe.call error:", err);
        }
    });
}
