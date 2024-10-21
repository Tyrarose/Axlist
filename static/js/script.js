document.addEventListener("DOMContentLoaded", function() {
    const ruleInput = document.getElementById("rule-input");
    const addRuleBtn = document.getElementById("add-rule-btn");
    const rulesList = document.getElementById("rules-list");
    const resetBtn = document.getElementById("reset-btn");
    const deleteBtn = document.getElementById("delete-btn");
    const totalRules = document.getElementById("total-rules");

    // Fetch existing rules from server and render them
    fetch('/rules')
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch rules');
            return res.json();
        })
        .then(data => {
            rulesList.innerHTML = ''; // Clear list before adding items
            data.forEach(rule => {
                addRuleToDOM(rule);  // Display the rules
            });
            updateTotalRules();  // Update the total number of rules
        })
        .catch(err => console.error('Error fetching rules:', err));

    // Add new rule
    addRuleBtn.addEventListener("click", function() {
        const ruleText = ruleInput.value.trim();
        if (ruleText !== "") {
            fetch('/rules', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: ruleText, checked: false})
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to add rule');
                return res.json();
            })
            .then(data => {
                // Add the new rule to the DOM
                addRuleToDOM({id: data.id, data: {text: ruleText, checked: false}});
                ruleInput.value = "";  // Clear input field after adding the rule
                updateTotalRules();
            })
            .catch(err => console.error('Error adding rule:', err));
        }
    });

    // Handle rule completion (check/uncheck)
    rulesList.addEventListener("click", function(e) {
        if (e.target.classList.contains("custom-checkbox")) {
            const ruleItem = e.target.closest("li");
            const ruleId = ruleItem.dataset.id;
            const completed = e.target.checked;
            fetch(`/rules/${ruleId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({checked: completed})
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to update rule');
                ruleItem.classList.toggle("completed", completed);
                moveCompletedRulesToEnd();
            })
            .catch(err => console.error('Error updating rule:', err));
        }
    });

    // Reset all rules (uncheck)
    resetBtn.addEventListener("click", function() {
        fetch('/reset_rules', {
            method: 'POST'
        }).then(() => {
            const checkboxes = document.querySelectorAll('.custom-checkbox');
            checkboxes.forEach(checkbox => checkbox.checked = false);
            const labels = document.querySelectorAll('.checkbox-label');
            labels.forEach(label => label.classList.remove('checked'));
        });
    });

    // Delete all rules
    deleteBtn.addEventListener("click", function() {
        fetch('/rules', {method: 'DELETE'})
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete all rules');
            rulesList.innerHTML = '';  // Clear the UI
            updateTotalRules();  // Reset the rule count
        })
        .catch(err => console.error('Error deleting all rules:', err));
    });

    function addRuleToDOM(rule) {
        const li = document.createElement("li");
        li.className = `list-group-item d-flex justify-content-between align-items-center ${rule.data.checked ? 'completed' : ''}`;
        li.dataset.id = rule.id;  // Store the document ID for later use
        li.innerHTML = `
            <input type="checkbox" class="custom-checkbox" id="rule-${rule.id}" ${rule.data.checked ? 'checked' : ''}>
            <label class="checkbox-label ${rule.data.checked ? 'checked' : ''}" for="rule-${rule.id}">${rule.data.text}</label>
            <button class="btn btn-danger btn-sm delete-btn">🗑️</button>
        `;
        rulesList.appendChild(li);

        // Add event listener to delete button
        li.querySelector('.delete-btn').addEventListener('click', function() {
            fetch(`/rules/${rule.id}`, {method: 'DELETE'})
            .then(res => {
                if (!res.ok) throw new Error('Failed to delete rule');
                li.remove();
                updateTotalRules();
            })
            .catch(err => console.error('Error deleting rule:', err));
        });
    }

    function updateTotalRules() {
        totalRules.textContent = rulesList.childElementCount;
    }

    function moveCompletedRulesToEnd() {
        const completedRules = [...rulesList.children].filter(li => li.querySelector(".custom-checkbox").checked);
        completedRules.forEach(rule => {
            rulesList.appendChild(rule);  // Move to the bottom of the list
        });
    }
});
